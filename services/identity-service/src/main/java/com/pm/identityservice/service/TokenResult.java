package com.pm.identityservice.service;

import java.time.Instant;

public record TokenResult(
        String accessToken,
        Instant expiresAt
) {
}
