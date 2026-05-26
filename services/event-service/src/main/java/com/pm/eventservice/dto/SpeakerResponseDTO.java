package com.pm.eventservice.dto;

import java.util.UUID;

public record SpeakerResponseDTO(
        UUID id,
        UUID eventId,
        String name,
        String title,
        String organization,
        String bio,
        String photoUrl
) {
}
