package com.pm.eventservice;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import tools.jackson.databind.ObjectMapper;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
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
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "Invalid Time Event",
                                "description", "This event has an invalid time range.",
                                "venueName", "Test Hall",
                                "venueCity", "Springfield",
                                "startsAt", startsAt,
                                "endsAt", endsAt,
                                "capacity", 10
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("End time must be after start time"));
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

    private org.springframework.http.HttpHeaders organizerHeaders() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.add("X-User-Id", ORGANIZER_ID.toString());
        headers.add("X-User-Role", "ORGANIZER");
        return headers;
    }

    private String eventRequest(String title, int capacity) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "title", title,
                "description", "A useful event for integration testing.",
                "venueName", "Test Hall",
                "venueCity", "Springfield",
                "startsAt", Instant.now().plusSeconds(86400),
                "endsAt", Instant.now().plusSeconds(90000),
                "capacity", capacity
        ));
    }
}
