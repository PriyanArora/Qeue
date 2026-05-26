package com.pm.registrationservice.messaging;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record EventInventoryMessage(
        String eventType,
        UUID eventId,
        UUID organizerId,
        String title,
        Instant startsAt,
        Integer capacity,
        String status,
        String venueName,
        String timezone,
        List<RegistrationTypeProjection> registrationTypes
) {
    public record RegistrationTypeProjection(
            UUID registrationTypeId,
            String name,
            Integer capacity,
            Boolean active
    ) {
    }
}
