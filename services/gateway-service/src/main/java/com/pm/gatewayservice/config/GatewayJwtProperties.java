package com.pm.gatewayservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gateway.jwt")
public record GatewayJwtProperties(
        String secret,
        String issuer
) {
}
