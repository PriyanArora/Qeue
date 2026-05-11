package com.pm.identityservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "identity.jwt")
public record JwtProperties(
        String secret,
        String issuer,
        long expirationMinutes
) {
}
