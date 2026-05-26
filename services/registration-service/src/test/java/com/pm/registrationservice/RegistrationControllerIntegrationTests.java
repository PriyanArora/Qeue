package com.pm.registrationservice;

import com.pm.registrationservice.dto.RegistrationRequestDTO;
import com.pm.registrationservice.exception.ConflictException;
import com.pm.registrationservice.messaging.EventInventoryConsumer;
import com.pm.registrationservice.messaging.RegistrationOutboxPublisher;
import com.pm.registrationservice.model.*;
import com.pm.registrationservice.repository.EventInventoryRepository;
import com.pm.registrationservice.repository.RegistrationOutboxRepository;
import com.pm.registrationservice.repository.RegistrationRepository;
import com.pm.registrationservice.service.RegistrationService;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.MessagePostProcessor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "grpc.server.port=0")
@AutoConfigureMockMvc
@Testcontainers
class RegistrationControllerIntegrationTests {
    private static final UUID ATTENDEE_ID = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1");
    private static final String ATTENDEE_EMAIL = "attendee@qeue.local";

    @Container
    private static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EventInventoryRepository inventoryRepository;

    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private RegistrationOutboxRepository outboxRepository;

    @Autowired
    private RegistrationService registrationService;

    @Autowired
    private EventInventoryConsumer eventInventoryConsumer;

    @Autowired
    private RegistrationOutboxPublisher outboxPublisher;

    @MockitoBean
    private RabbitTemplate rabbitTemplate;

    @Test
    void listsCurrentAttendeeRegistrations() throws Exception {
        mockMvc.perform(get("/api/me/registrations")
                        .headers(attendeeHeaders(UUID.randomUUID(), "list@example.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void rejectsRegistrationRouteWithoutAttendeeRole() throws Exception {
        UUID eventId = UUID.randomUUID();
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.add("X-User-Id", UUID.randomUUID().toString());
        headers.add("X-User-Email", "organizer@example.com");
        headers.add("X-User-Role", "ORGANIZER");

        mockMvc.perform(post("/api/events/{eventId}/registrations", eventId)
                        .headers(headers)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationRequest("wrong-role-" + eventId)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Attendee role is required"));
    }

    @Test
    void enforcesUniqueActiveRegistrationRule() {
        UUID eventId = UUID.randomUUID();
        UUID attendeeId = UUID.randomUUID();
        inventoryRepository.saveAndFlush(inventory(eventId, 10, 0, EventStatus.PUBLISHED));
        registrationRepository.saveAndFlush(registration(eventId, attendeeId, "one"));

        assertThrows(DataIntegrityViolationException.class, () ->
                registrationRepository.saveAndFlush(registration(eventId, attendeeId, "two")));
    }

    @Test
    void inventoryVersionIncrementsOnUpdate() {
        UUID eventId = UUID.randomUUID();
        EventInventory saved = inventoryRepository.saveAndFlush(inventory(eventId, 10, 0, EventStatus.PUBLISHED));
        Long initialVersion = saved.getVersion();

        saved.setConfirmedCount(1);
        EventInventory updated = inventoryRepository.saveAndFlush(saved);

        assertNotNull(initialVersion);
        assertTrue(updated.getVersion() > initialVersion);
    }

    @Test
    void registersWhenCapacityAvailableAndWritesOutbox() throws Exception {
        UUID eventId = UUID.randomUUID();
        inventoryRepository.saveAndFlush(inventory(eventId, 2, 0, EventStatus.PUBLISHED));

        mockMvc.perform(post("/api/events/{eventId}/registrations", eventId)
                        .headers(attendeeHeaders(ATTENDEE_ID, ATTENDEE_EMAIL))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationRequest("available-" + eventId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.eventId").value(eventId.toString()))
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        EventInventory updated = inventoryRepository.findById(eventId).orElseThrow();
        assertEquals(1, updated.getConfirmedCount());

        mockMvc.perform(get("/api/internal/outbox/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].eventType", hasItem("RegistrationConfirmed")));
    }

    @Test
    void rejectsSoldOutEvent() throws Exception {
        UUID eventId = UUID.randomUUID();
        inventoryRepository.saveAndFlush(inventory(eventId, 1, 1, EventStatus.PUBLISHED));

        mockMvc.perform(post("/api/events/{eventId}/registrations", eventId)
                        .headers(attendeeHeaders(UUID.randomUUID(), "soldout@example.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationRequest("soldout-" + eventId)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Event is sold out"));
    }

    @Test
    void rejectsCancelledEvent() throws Exception {
        UUID eventId = UUID.randomUUID();
        inventoryRepository.saveAndFlush(inventory(eventId, 10, 0, EventStatus.CANCELLED));

        mockMvc.perform(post("/api/events/{eventId}/registrations", eventId)
                        .headers(attendeeHeaders(UUID.randomUUID(), "cancelled@example.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationRequest("cancelled-" + eventId)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Event is not available for registration"));
    }

    @Test
    void rejectsDuplicateRegistrationForDifferentIdempotencyKey() throws Exception {
        UUID eventId = UUID.randomUUID();
        UUID attendeeId = UUID.randomUUID();
        inventoryRepository.saveAndFlush(inventory(eventId, 10, 0, EventStatus.PUBLISHED));

        mockMvc.perform(post("/api/events/{eventId}/registrations", eventId)
                        .headers(attendeeHeaders(attendeeId, "duplicate@example.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationRequest("duplicate-one")))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/events/{eventId}/registrations", eventId)
                        .headers(attendeeHeaders(attendeeId, "duplicate@example.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationRequest("duplicate-two")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Attendee is already registered for this event"));
    }

    @Test
    void returnsSameRegistrationForRepeatedIdempotencyKey() throws Exception {
        UUID eventId = UUID.randomUUID();
        UUID attendeeId = UUID.randomUUID();
        inventoryRepository.saveAndFlush(inventory(eventId, 10, 0, EventStatus.PUBLISHED));

        String firstResponse = mockMvc.perform(post("/api/events/{eventId}/registrations", eventId)
                        .headers(attendeeHeaders(attendeeId, "idempotent@example.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationRequest("same-key")))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String secondResponse = mockMvc.perform(post("/api/events/{eventId}/registrations", eventId)
                        .headers(attendeeHeaders(attendeeId, "idempotent@example.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationRequest("same-key")))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertEquals(
                objectMapper.readTree(firstResponse).get("registrationId").asText(),
                objectMapper.readTree(secondResponse).get("registrationId").asText()
        );
    }

    @Test
    void concurrentRegistrationsDoNotExceedCapacity() throws Exception {
        UUID eventId = UUID.randomUUID();
        inventoryRepository.saveAndFlush(inventory(eventId, 1, 0, EventStatus.PUBLISHED));

        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> tryRegister(eventId, UUID.randomUUID(), "concurrent-one@example.com", "concurrent-one"));
            var second = executor.submit(() -> tryRegister(eventId, UUID.randomUUID(), "concurrent-two@example.com", "concurrent-two"));

            executor.shutdown();
            assertTrue(executor.awaitTermination(10, TimeUnit.SECONDS));
            int successes = (first.get() ? 1 : 0) + (second.get() ? 1 : 0);

            assertEquals(1, successes);
            assertEquals(1, inventoryRepository.findById(eventId).orElseThrow().getConfirmedCount());
        }
    }

    @Test
    void cancelsOwnedRegistrationAndWritesOutbox() throws Exception {
        UUID eventId = UUID.randomUUID();
        UUID attendeeId = UUID.randomUUID();
        inventoryRepository.saveAndFlush(inventory(eventId, 3, 0, EventStatus.PUBLISHED));

        String registerResponse = mockMvc.perform(post("/api/events/{eventId}/registrations", eventId)
                        .headers(attendeeHeaders(attendeeId, "cancel-own@example.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationRequest("cancel-own")))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String registrationId = objectMapper.readTree(registerResponse).get("registrationId").asText();

        mockMvc.perform(delete("/api/registrations/{registrationId}", registrationId)
                        .headers(attendeeHeaders(attendeeId, "cancel-own@example.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        assertEquals(0, inventoryRepository.findById(eventId).orElseThrow().getConfirmedCount());
        mockMvc.perform(get("/api/internal/outbox/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].eventType", hasItem("RegistrationCancelled")));
    }

    @Test
    void allowsNewRegistrationAfterCancellationAndCanCancelAgain() throws Exception {
        UUID eventId = UUID.randomUUID();
        UUID attendeeId = UUID.randomUUID();
        inventoryRepository.saveAndFlush(inventory(eventId, 3, 0, EventStatus.PUBLISHED));

        String firstRegistrationId = registerAndReadId(eventId, attendeeId, "repeat-cancel@example.com", "repeat-first");

        mockMvc.perform(delete("/api/registrations/{registrationId}", firstRegistrationId)
                        .headers(attendeeHeaders(attendeeId, "repeat-cancel@example.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        String secondRegistrationId = registerAndReadId(eventId, attendeeId, "repeat-cancel@example.com", "repeat-second");

        mockMvc.perform(delete("/api/registrations/{registrationId}", secondRegistrationId)
                        .headers(attendeeHeaders(attendeeId, "repeat-cancel@example.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        assertEquals(0, inventoryRepository.findById(eventId).orElseThrow().getConfirmedCount());
    }

    @Test
    void rejectsCancellingAnotherAttendeesRegistration() throws Exception {
        UUID eventId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        inventoryRepository.saveAndFlush(inventory(eventId, 3, 0, EventStatus.PUBLISHED));

        String registerResponse = mockMvc.perform(post("/api/events/{eventId}/registrations", eventId)
                        .headers(attendeeHeaders(ownerId, "owner@example.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationRequest("owner-key")))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String registrationId = objectMapper.readTree(registerResponse).get("registrationId").asText();

        mockMvc.perform(delete("/api/registrations/{registrationId}", registrationId)
                        .headers(attendeeHeaders(UUID.randomUUID(), "other@example.com")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Cannot cancel another attendee's registration"));
    }

    @Test
    void eventPublishedMessageUpsertsInventory() throws Exception {
        UUID eventId = UUID.randomUUID();

        eventInventoryConsumer.consumeEventMessage(eventMessage("EventPublished", eventId, "Projected Java Day", 44));

        EventInventory inventory = inventoryRepository.findById(eventId).orElseThrow();
        assertEquals("Projected Java Day", inventory.getTitle());
        assertEquals(44, inventory.getCapacity());
        assertEquals(0, inventory.getConfirmedCount());
        assertEquals(EventStatus.PUBLISHED, inventory.getEventStatus());
    }

    @Test
    void duplicateEventPublishedMessageDoesNotResetConfirmedCount() throws Exception {
        UUID eventId = UUID.randomUUID();

        eventInventoryConsumer.consumeEventMessage(eventMessage("EventPublished", eventId, "Projected Capacity Lab", 10));
        EventInventory inventory = inventoryRepository.findById(eventId).orElseThrow();
        inventory.setConfirmedCount(2);
        inventoryRepository.saveAndFlush(inventory);

        eventInventoryConsumer.consumeEventMessage(eventMessage("EventPublished", eventId, "Projected Capacity Lab", 10));

        EventInventory projectedAgain = inventoryRepository.findById(eventId).orElseThrow();
        assertEquals(2, projectedAgain.getConfirmedCount());
        assertEquals(EventStatus.PUBLISHED, projectedAgain.getEventStatus());
    }

    @Test
    void eventCancelledMessageMarksInventoryCancelled() throws Exception {
        UUID eventId = UUID.randomUUID();
        inventoryRepository.saveAndFlush(inventory(eventId, 10, 3, EventStatus.PUBLISHED));

        eventInventoryConsumer.consumeEventMessage(eventMessage("EventCancelled", eventId, "Cancelled Projection Lab", 10));

        EventInventory inventory = inventoryRepository.findById(eventId).orElseThrow();
        assertEquals(3, inventory.getConfirmedCount());
        assertEquals(EventStatus.CANCELLED, inventory.getEventStatus());
    }

    @Test
    void publisherSendsRegistrationConfirmedMessageAndMarksItPublished() throws Exception {
        UUID eventId = UUID.randomUUID();
        UUID attendeeId = UUID.randomUUID();
        inventoryRepository.saveAndFlush(inventory(eventId, 3, 0, EventStatus.PUBLISHED));

        String registrationId = registerAndReadId(eventId, attendeeId, "rabbit-confirmed@example.com", "rabbit-confirmed");

        int publishedCount = outboxPublisher.publishPending();

        RegistrationOutboxMessage message = outboxRepository
                .findByAggregateIdAndEventType(UUID.fromString(registrationId), "RegistrationConfirmed")
                .orElseThrow();
        assertTrue(publishedCount >= 1);
        assertEquals(OutboxStatus.PUBLISHED, message.getStatus());
        verify(rabbitTemplate, atLeastOnce()).convertAndSend(
                eq("qeue.events"),
                eq("registration.confirmed.v1"),
                anyString(),
                any(MessagePostProcessor.class)
        );
    }

    private boolean tryRegister(UUID eventId, UUID attendeeId, String email, String idempotencyKey) {
        try {
            registrationService.register(eventId, attendeeId, email, new RegistrationRequestDTO(idempotencyKey, null, List.of()));
            return true;
        } catch (ConflictException ex) {
            return false;
        }
    }

    private org.springframework.http.HttpHeaders attendeeHeaders(UUID attendeeId, String attendeeEmail) {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.add("X-User-Id", attendeeId.toString());
        headers.add("X-User-Email", attendeeEmail);
        headers.add("X-User-Role", "ATTENDEE");
        return headers;
    }

    private String registrationRequest(String idempotencyKey) throws Exception {
        return objectMapper.writeValueAsString(Map.of("idempotencyKey", idempotencyKey));
    }

    private String eventMessage(String eventType, UUID eventId, String title, int capacity) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "eventType", eventType,
                "eventId", eventId,
                "organizerId", UUID.randomUUID(),
                "title", title,
                "startsAt", Instant.now().plusSeconds(86400),
                "venueName", "Test Hall",
                "timezone", "UTC",
                "capacity", capacity,
                "status", eventType.equals("EventCancelled") ? "CANCELLED" : "PUBLISHED"
        ));
    }

    private String registerAndReadId(UUID eventId, UUID attendeeId, String email, String idempotencyKey) throws Exception {
        String response = mockMvc.perform(post("/api/events/{eventId}/registrations", eventId)
                        .headers(attendeeHeaders(attendeeId, email))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationRequest(idempotencyKey)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).get("registrationId").asText();
    }

    private EventInventory inventory(UUID eventId, int capacity, int confirmedCount, EventStatus status) {
        EventInventory inventory = new EventInventory();
        inventory.setEventId(eventId);
        inventory.setTitle("Inventory " + eventId);
        inventory.setOrganizerId(UUID.randomUUID());
        inventory.setStartsAt(Instant.now().plusSeconds(86400));
        inventory.setVenueName("Test Hall");
        inventory.setTimezone("UTC");
        inventory.setCapacity(capacity);
        inventory.setConfirmedCount(confirmedCount);
        inventory.setEventStatus(status);
        return inventory;
    }

    private Registration registration(UUID eventId, UUID attendeeId, String idempotencyKey) {
        Registration registration = new Registration();
        registration.setEventId(eventId);
        registration.setAttendeeId(attendeeId);
        registration.setAttendeeEmail(attendeeId + "@example.com");
        registration.setAttendeeDisplayNameSnapshot(attendeeId + "@example.com");
        registration.setStatus(RegistrationStatus.CONFIRMED);
        registration.setCheckInStatus(CheckInStatus.NOT_CHECKED_IN);
        registration.setIdempotencyKey(idempotencyKey);
        registration.setActiveRegistrationKey(RegistrationStatus.CONFIRMED.name());
        registration.setCreatedAt(Instant.now());
        return registration;
    }
}
