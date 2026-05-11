package com.pm.identityservice.dto;

import com.pm.identityservice.model.UserRole;

import java.time.Instant;
import java.util.UUID;

public record AuthResponseDTO(
        UUID userId,
        String email,
        String displayName,
        UserRole role,
        String tokenType,
        String accessToken,
        Instant expiresAt
) {
}
