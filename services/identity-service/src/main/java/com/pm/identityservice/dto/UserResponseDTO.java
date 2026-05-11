package com.pm.identityservice.dto;

import com.pm.identityservice.model.UserRole;

import java.util.UUID;

public record UserResponseDTO(
        UUID userId,
        String email,
        String displayName,
        UserRole role
) {
}
