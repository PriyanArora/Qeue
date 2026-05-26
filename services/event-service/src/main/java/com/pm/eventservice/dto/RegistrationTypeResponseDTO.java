package com.pm.eventservice.dto;

import java.util.UUID;

public record RegistrationTypeResponseDTO(
        UUID id,
        UUID eventId,
        String name,
        String description,
        Integer capacity,
        boolean active,
        Integer sortOrder
) {
}
