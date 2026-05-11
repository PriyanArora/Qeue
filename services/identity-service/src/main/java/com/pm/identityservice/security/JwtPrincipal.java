package com.pm.identityservice.security;

import com.pm.identityservice.model.UserRole;

import java.util.UUID;

public record JwtPrincipal(
        UUID userId,
        String email,
        UserRole role
) {
}
