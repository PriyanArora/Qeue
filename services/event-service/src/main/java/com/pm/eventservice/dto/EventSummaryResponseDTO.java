package com.pm.eventservice.dto;

import com.pm.eventservice.model.EventStatus;

import java.time.Instant;
import java.util.UUID;

public record EventSummaryResponseDTO(
        UUID id,
        UUID organizerId,
        String title,
        String venueName,
        String venueCity,
        Instant startsAt,
        Instant endsAt,
        Integer capacity,
        EventStatus status
) {
}
