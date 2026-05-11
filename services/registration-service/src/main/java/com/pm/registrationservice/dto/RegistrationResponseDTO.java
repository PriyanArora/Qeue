package com.pm.registrationservice.dto;

import com.pm.registrationservice.model.RegistrationStatus;

import java.time.Instant;
import java.util.UUID;

public record RegistrationResponseDTO(
        UUID registrationId,
        UUID eventId,
        String eventTitle,
        Instant startsAt,
        UUID attendeeId,
        String attendeeEmail,
        RegistrationStatus status,
        Instant createdAt,
        Instant cancelledAt
) {
}
