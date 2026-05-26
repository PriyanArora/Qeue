package com.pm.eventservice;

import com.pm.eventservice.messaging.EventOutboxPublisher;
import com.pm.eventservice.model.EventOutboxMessage;
import com.pm.eventservice.model.OutboxStatus;
import com.pm.eventservice.repository.EventOutboxRepository;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.MessagePostProcessor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import tools.jackson.databind.ObjectMapper;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class EventControllerIntegrationTests {
    private static final UUID ORGANIZER_ID = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EventOutboxRepository outboxRepository;

    @Autowired
    private EventOutboxPublisher outboxPublisher;

    @Autowired
    private RecordingRabbitTemplate rabbitTemplate;

    @Test
    void createsValidDraftEvent() throws Exception {
        mockMvc.perform(post("/api/organizer/events")
                        .headers(organizerHeaders())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventRequest("Valid Draft Event", 50)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Valid Draft Event"))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.organizerId").value(ORGANIZER_ID.toString()));
    }

    @Test
    void rejectsBlankTitle() throws Exception {
        mockMvc.perform(post("/api/organizer/events")
                        .headers(organizerHeaders())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventRequest("", 50)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.title").value("Title is required"));
    }

    @Test
    void rejectsCapacityLessThanOne() throws Exception {
        mockMvc.perform(post("/api/organizer/events")
                        .headers(organizerHeaders())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventRequest("Tiny Event", 0)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.capacity").value("Capacity must be at least 1"));
    }

    @Test
    void rejectsEndBeforeStart() throws Exception {
        Instant startsAt = Instant.now().plusSeconds(172800);
        Instant endsAt = Instant.now().plusSeconds(86400);

        mockMvc.perform(post("/api/organizer/events")
                        .headers(organizerHeaders())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.ofEntries(
                                Map.entry("title", "Invalid Time Event"),
                                Map.entry("description", "This event has an invalid time range."),
                                Map.entry("eventFormat", "IN_PERSON"),
                                Map.entry("category", "Testing"),
                                Map.entry("bannerImageUrl", ""),
                                Map.entry("venueName", "Test Hall"),
                                Map.entry("venueCity", "Springfield"),
                                Map.entry("venueAddress", "1 Test Way"),
                                Map.entry("timezone", "UTC"),
                                Map.entry("startsAt", startsAt),
                                Map.entry("endsAt", endsAt),
                                Map.entry("capacity", 10)
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("End time must be after start time"));
    }

    @Test
    void organizerCanReadOwnDraftEvent() throws Exception {
        String title = "Organizer Draft Detail " + UUID.randomUUID();
        String response = mockMvc.perform(post("/api/organizer/events")
                        .headers(organizerHeaders())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventRequest(title, 30)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String eventId = objectMapper.readTree(response).get("id").asText();

        mockMvc.perform(get("/api/organizer/events/{eventId}", eventId)
                        .headers(organizerHeaders()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value(title))
                .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    void publishesListsCancelsAndWritesOutboxMessages() throws Exception {
        String title = "Publish Flow " + UUID.randomUUID();
        String response = mockMvc.perform(post("/api/organizer/events")
                        .headers(organizerHeaders())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventRequest(title, 30)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String eventId = objectMapper.readTree(response).get("id").asText();

        mockMvc.perform(post("/api/organizer/events/{eventId}/publish", eventId)
                        .headers(organizerHeaders()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        mockMvc.perform(get("/api/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", hasItem(title)));

        mockMvc.perform(get("/api/internal/outbox/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].eventType", hasItem("EventPublished")));

        mockMvc.perform(post("/api/organizer/events/{eventId}/cancel", eventId)
                        .headers(organizerHeaders()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        mockMvc.perform(get("/api/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", not(hasItem(title))));

        mockMvc.perform(get("/api/internal/outbox/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].eventType", hasItem("EventCancelled")));
    }

    @Test
    void publisherSendsPendingOutboxMessageAndMarksItPublished() throws Exception {
        String title = "Rabbit Publish Flow " + UUID.randomUUID();
        String response = mockMvc.perform(post("/api/organizer/events")
                        .headers(organizerHeaders())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventRequest(title, 30)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        UUID eventId = UUID.fromString(objectMapper.readTree(response).get("id").asText());

        mockMvc.perform(post("/api/organizer/events/{eventId}/publish", eventId)
                        .headers(organizerHeaders()))
                .andExpect(status().isOk());

        int publishedCount = outboxPublisher.publishPending();

        EventOutboxMessage outboxMessage = outboxRepository
                .findByAggregateIdAndEventType(eventId, "EventPublished")
                .orElseThrow();
        assertEquals(OutboxStatus.PUBLISHED, outboxMessage.getStatus());
        assertTrue(publishedCount >= 1);
        assertTrue(rabbitTemplate.wasPublished("qeue.events", "event.published.v1"));
    }

    private org.springframework.http.HttpHeaders organizerHeaders() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.add("X-User-Id", ORGANIZER_ID.toString());
        headers.add("X-User-Role", "ORGANIZER");
        return headers;
    }

    private String eventRequest(String title, int capacity) throws Exception {
        return objectMapper.writeValueAsString(Map.ofEntries(
                Map.entry("title", title),
                Map.entry("description", "A useful event for integration testing."),
                Map.entry("eventFormat", "IN_PERSON"),
                Map.entry("category", "Testing"),
                Map.entry("bannerImageUrl", ""),
                Map.entry("venueName", "Test Hall"),
                Map.entry("venueCity", "Springfield"),
                Map.entry("venueAddress", "1 Test Way"),
                Map.entry("timezone", "UTC"),
                Map.entry("startsAt", Instant.now().plusSeconds(86400)),
                Map.entry("endsAt", Instant.now().plusSeconds(90000)),
                Map.entry("capacity", capacity)
        ));
    }

    @TestConfiguration
    static class RabbitTestConfig {
        @Bean
        @Primary
        RecordingRabbitTemplate rabbitTemplate() {
            return new RecordingRabbitTemplate();
        }
    }

    static class RecordingRabbitTemplate extends RabbitTemplate {
        private final List<PublishedMessage> publishedMessages = new CopyOnWriteArrayList<>();

        @Override
        public void afterPropertiesSet() {
        }

        @Override
        public void convertAndSend(
                String exchange,
                String routingKey,
                Object message,
                MessagePostProcessor messagePostProcessor
        ) {
            publishedMessages.add(new PublishedMessage(exchange, routingKey, message));
        }

        boolean wasPublished(String exchange, String routingKey) {
            return publishedMessages.stream()
                    .anyMatch(message -> message.exchange().equals(exchange)
                            && message.routingKey().equals(routingKey));
        }
    }

    record PublishedMessage(String exchange, String routingKey, Object message) {
    }
}
