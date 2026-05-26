package com.pm.eventservice.dto;

import com.pm.eventservice.model.SessionStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SessionResponseDTO(
        UUID id,
        UUID eventId,
        String title,
        String description,
        Instant startsAt,
        Instant endsAt,
        String roomName,
        Integer capacity,
        SessionStatus status,
        List<SpeakerResponseDTO> speakers
) {
}
