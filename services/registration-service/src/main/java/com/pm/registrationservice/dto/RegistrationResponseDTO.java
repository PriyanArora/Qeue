package com.pm.registrationservice.dto;

import com.pm.registrationservice.model.CheckInStatus;
import com.pm.registrationservice.model.RegistrationStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record RegistrationResponseDTO(
        UUID registrationId,
        UUID eventId,
        String eventTitle,
        Instant startsAt,
        UUID attendeeId,
        String attendeeEmail,
        String attendeeDisplayNameSnapshot,
        UUID registrationTypeId,
        String registrationTypeNameSnapshot,
        RegistrationStatus status,
        CheckInStatus checkInStatus,
        Instant createdAt,
        Instant cancelledAt,
        Instant checkedInAt,
        List<RegistrationAnswerDTO> answers
) {
}
