package com.pm.eventservice.dto;

import com.pm.eventservice.model.EventStatus;

import java.time.Instant;
import java.util.UUID;

public record EventDetailResponseDTO(
        UUID id,
        UUID organizerId,
        String title,
        String description,
        String venueName,
        String venueCity,
        Instant startsAt,
        Instant endsAt,
        Integer capacity,
        EventStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
