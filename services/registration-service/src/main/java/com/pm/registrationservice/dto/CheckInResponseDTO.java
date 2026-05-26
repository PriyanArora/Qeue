package com.pm.registrationservice.dto;

import com.pm.registrationservice.model.CheckInStatus;

import java.time.Instant;
import java.util.UUID;

public record CheckInResponseDTO(
        CheckInStatus status,
        UUID registrationId,
        String attendeeEmail,
        Instant checkedInAt
) {
}
