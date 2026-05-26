package com.pm.notificationworker.messaging;

import java.time.Instant;
import java.util.UUID;

public record RegistrationNotificationMessage(
        String eventType,
        UUID registrationId,
        UUID eventId,
        String eventTitle,
        UUID attendeeId,
        String attendeeEmail,
        String startsAt,
        String venueName,
        String registrationTypeName,
        String status,
        Instant createdAt,
        Instant cancelledAt
) {
}
