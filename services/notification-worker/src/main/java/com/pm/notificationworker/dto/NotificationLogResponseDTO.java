package com.pm.notificationworker.dto;

import com.pm.notificationworker.model.NotificationStatus;
import com.pm.notificationworker.model.NotificationType;

import java.time.Instant;
import java.util.UUID;

public record NotificationLogResponseDTO(
        UUID id,
        UUID registrationId,
        UUID eventId,
        String recipientEmail,
        NotificationType notificationType,
        NotificationStatus status,
        String messageId,
        String renderedSubject,
        String renderedBody,
        Instant createdAt
) {
}
