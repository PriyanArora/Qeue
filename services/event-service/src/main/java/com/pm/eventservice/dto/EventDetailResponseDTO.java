package com.pm.eventservice.dto;

import com.pm.eventservice.model.EventStatus;
import com.pm.eventservice.model.EventFormat;

import java.time.Instant;
import java.util.UUID;

public record EventDetailResponseDTO(
        UUID id,
        UUID organizerId,
        String title,
        String description,
        EventFormat eventFormat,
        String category,
        String bannerImageUrl,
        String venueName,
        String venueCity,
        String venueAddress,
        String timezone,
        Instant startsAt,
        Instant endsAt,
        Integer capacity,
        EventStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
