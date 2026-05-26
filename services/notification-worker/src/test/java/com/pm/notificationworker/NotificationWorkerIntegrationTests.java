package com.pm.notificationworker;

import com.pm.notificationworker.messaging.RegistrationNotificationConsumer;
import com.pm.notificationworker.model.NotificationStatus;
import com.pm.notificationworker.model.NotificationType;
import com.pm.notificationworker.repository.NotificationLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class NotificationWorkerIntegrationTests {

    @Autowired
    private RegistrationNotificationConsumer consumer;

    @Autowired
    private NotificationLogRepository notificationLogRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MockMvc mockMvc;

    @Test
    void recordsConfirmedNotification() throws Exception {
        UUID registrationId = UUID.randomUUID();

        consumer.consumeRegistrationMessage(registrationMessage("RegistrationConfirmed", registrationId));

        var log = notificationLogRepository
                .findByRegistrationIdAndNotificationType(registrationId, NotificationType.REGISTRATION_CONFIRMED)
                .orElseThrow();
        assertEquals(NotificationStatus.SKIPPED, log.getStatus());
        assertEquals("attendee@example.com", log.getRecipientEmail());
    }

    @Test
    void recordsCancelledNotification() throws Exception {
        UUID registrationId = UUID.randomUUID();

        consumer.consumeRegistrationMessage(registrationMessage("RegistrationCancelled", registrationId));

        var log = notificationLogRepository
                .findByRegistrationIdAndNotificationType(registrationId, NotificationType.REGISTRATION_CANCELLED)
                .orElseThrow();
        assertEquals(NotificationStatus.SKIPPED, log.getStatus());
    }

    @Test
    void duplicateMessageCreatesOneNotificationLog() throws Exception {
        UUID registrationId = UUID.randomUUID();
        String payload = registrationMessage("RegistrationConfirmed", registrationId);

        consumer.consumeRegistrationMessage(payload);
        consumer.consumeRegistrationMessage(payload);

        assertTrue(notificationLogRepository.existsByRegistrationIdAndNotificationType(
                registrationId,
                NotificationType.REGISTRATION_CONFIRMED
        ));
        long matchingLogs = notificationLogRepository.findAll()
                .stream()
                .filter(log -> log.getRegistrationId().equals(registrationId))
                .filter(log -> log.getNotificationType() == NotificationType.REGISTRATION_CONFIRMED)
                .count();
        assertEquals(1, matchingLogs);
    }

    @Test
    void internalEndpointListsNotificationLogs() throws Exception {
        UUID registrationId = UUID.randomUUID();
        consumer.consumeRegistrationMessage(registrationMessage("RegistrationConfirmed", registrationId));

        mockMvc.perform(get("/api/internal/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].registrationId").isArray());
    }

    private String registrationMessage(String eventType, UUID registrationId) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "eventType", eventType,
                "registrationId", registrationId,
                "eventId", UUID.randomUUID(),
                "eventTitle", "Springfield Java Meetup",
                "attendeeId", UUID.randomUUID(),
                "attendeeEmail", "attendee@example.com",
                "status", eventType.equals("RegistrationCancelled") ? "CANCELLED" : "CONFIRMED",
                "createdAt", Instant.now()
        ));
    }
}
