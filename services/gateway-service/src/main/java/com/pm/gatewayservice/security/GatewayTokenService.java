package com.pm.gatewayservice.security;

import com.pm.gatewayservice.config.GatewayJwtProperties;
import com.pm.gatewayservice.exception.UnauthorizedException;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class GatewayTokenService {
    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder URL_DECODER = Base64.getUrlDecoder();
    private static final Set<String> SUPPORTED_ROLES = Set.of("ORGANIZER", "ATTENDEE");

    private final GatewayJwtProperties jwtProperties;
    private final ObjectMapper objectMapper;

    public GatewayTokenService(GatewayJwtProperties jwtProperties, ObjectMapper objectMapper) {
        this.jwtProperties = jwtProperties;
        this.objectMapper = objectMapper;
    }

    public GatewayPrincipal validateToken(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new UnauthorizedException("Invalid token");
        }

        String signingInput = parts[0] + "." + parts[1];
        if (!MessageDigest.isEqual(sign(signingInput).getBytes(StandardCharsets.UTF_8), parts[2].getBytes(StandardCharsets.UTF_8))) {
            throw new UnauthorizedException("Invalid token");
        }

        Map<String, Object> payload = decodePayload(parts[1]);
        if (!jwtProperties.issuer().equals(payload.get("iss"))) {
            throw new UnauthorizedException("Invalid token issuer");
        }
        if (!Instant.ofEpochSecond(requiredNumber(payload, "exp").longValue()).isAfter(Instant.now())) {
            throw new UnauthorizedException("Token expired");
        }

        String role = requiredString(payload, "role");
        if (!SUPPORTED_ROLES.contains(role)) {
            throw new UnauthorizedException("Invalid token role");
        }

        return new GatewayPrincipal(
                UUID.fromString(requiredString(payload, "sub")),
                requiredString(payload, "email"),
                role
        );
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> decodePayload(String payload) {
        try {
            String json = new String(URL_DECODER.decode(payload), StandardCharsets.UTF_8);
            return objectMapper.readValue(json, Map.class);
        } catch (RuntimeException ex) {
            throw new UnauthorizedException("Invalid token payload");
        }
    }

    private String sign(String signingInput) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            mac.init(new SecretKeySpec(jwtProperties.secret().getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
            return URL_ENCODER.encodeToString(mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to verify token", ex);
        }
    }

    private String requiredString(Map<String, Object> payload, String claimName) {
        Object value = payload.get(claimName);
        if (value instanceof String stringValue && !stringValue.isBlank()) {
            return stringValue;
        }
        throw new UnauthorizedException("Invalid token payload");
    }

    private Number requiredNumber(Map<String, Object> payload, String claimName) {
        Object value = payload.get(claimName);
        if (value instanceof Number numberValue) {
            return numberValue;
        }
        throw new UnauthorizedException("Invalid token payload");
    }
}
