package com.pm.gatewayservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gateway.routes")
public record GatewayRouteProperties(
        String identityUrl,
        String eventUrl,
        String registrationUrl
) {
}
