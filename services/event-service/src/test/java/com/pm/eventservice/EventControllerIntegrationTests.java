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

    @Test
    void organizerCanConfigureQuestionsTypesSpeakersSessionsAndSurveys() throws Exception {
        String eventResponse = createDraftEvent("Setup Flow " + UUID.randomUUID(), 40);
        String eventId = objectMapper.readTree(eventResponse).get("id").asText();
        Instant eventStart = Instant.parse(objectMapper.readTree(eventResponse).get("startsAt").asText());

        mockMvc.perform(post("/api/organizer/events/{eventId}/registration-questions", eventId)
                        .headers(organizerHeaders())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "questionText", "Dietary restrictions?",
                                "questionType", "TEXT",
                                "required", true,
                                "sortOrder", 1,
                                "active", true
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.required").value(true));

        mockMvc.perform(post("/api/organizer/events/{eventId}/registration-types", eventId)
                        .headers(organizerHeaders())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Student",
                                "description", "Student attendee",
                                "capacity", 10,
                                "active", true,
                                "sortOrder", 1
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Student"));

        String speakerResponse = mockMvc.perform(post("/api/organizer/events/{eventId}/speakers", eventId)
                        .headers(organizerHeaders())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Ada Lovelace",
                                "title", "Speaker",
                                "organization", "Analytical Engines",
                                "bio", "Computing pioneer",
                                "photoUrl", ""
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Ada Lovelace"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        String speakerId = objectMapper.readTree(speakerResponse).get("id").asText();

        mockMvc.perform(post("/api/organizer/events/{eventId}/sessions", eventId)
                        .headers(organizerHeaders())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "Opening Session",
                                "description", "Kickoff",
                                "startsAt", eventStart.plusSeconds(600),
                                "endsAt", eventStart.plusSeconds(1800),
                                "roomName", "Main room",
                                "capacity", 30,
                                "status", "PUBLISHED",
                                "speakerIds", List.of(speakerId)
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.speakers[0].name").value("Ada Lovelace"));

        mockMvc.perform(post("/api/organizer/events/{eventId}/surveys", eventId)
                        .headers(organizerHeaders())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "Post-event feedback",
                                "status", "ACTIVE",
                                "questions", List.of(Map.of(
                                        "questionText", "How was it?",
                                        "questionType", "TEXT",
                                        "required", true,
                                        "sortOrder", 1
                                ))
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.questions[0].questionText").value("How was it?"));

        mockMvc.perform(post("/api/organizer/events/{eventId}/publish", eventId)
                        .headers(organizerHeaders()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/events/{eventId}/registration-questions", eventId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].questionText").value("Dietary restrictions?"));
        mockMvc.perform(get("/api/events/{eventId}/registration-types", eventId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Student"));
        mockMvc.perform(get("/api/events/{eventId}/sessions", eventId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Opening Session"));
        mockMvc.perform(get("/api/events/{eventId}/surveys/active", eventId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Post-event feedback"));
    }

    @Test
    void rejectsSessionOutsideEventTimeRange() throws Exception {
        String eventResponse = createDraftEvent("Session Validation " + UUID.randomUUID(), 20);
        String eventId = objectMapper.readTree(eventResponse).get("id").asText();
        Instant eventEnd = Instant.parse(objectMapper.readTree(eventResponse).get("endsAt").asText());

        mockMvc.perform(post("/api/organizer/events/{eventId}/sessions", eventId)
                        .headers(organizerHeaders())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "Late Session",
                                "description", "Outside event",
                                "startsAt", eventEnd.plusSeconds(600),
                                "endsAt", eventEnd.plusSeconds(1800),
                                "roomName", "Main room",
                                "capacity", 20,
                                "status", "PUBLISHED",
                                "speakerIds", List.of()
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Session must be inside event time range"));
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

    private String createDraftEvent(String title, int capacity) throws Exception {
        return mockMvc.perform(post("/api/organizer/events")
                        .headers(organizerHeaders())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventRequest(title, capacity)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
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
