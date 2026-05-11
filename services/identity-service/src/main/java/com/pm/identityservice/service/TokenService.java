package com.pm.identityservice.service;

import com.pm.identityservice.config.JwtProperties;
import com.pm.identityservice.exception.UnauthorizedException;
import com.pm.identityservice.model.User;
import com.pm.identityservice.model.UserRole;
import com.pm.identityservice.security.JwtPrincipal;
import org.springframework.stereotype.Service;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Service
public class TokenService {
    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder URL_DECODER = Base64.getUrlDecoder();

    private final JwtProperties jwtProperties;
    private final ObjectMapper objectMapper;

    public TokenService(JwtProperties jwtProperties, ObjectMapper objectMapper) {
        this.jwtProperties = jwtProperties;
        this.objectMapper = objectMapper;
    }

    public TokenResult createToken(User user) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plusSeconds(jwtProperties.expirationMinutes() * 60);
        String header = encodeJson(Map.of("alg", "HS256", "typ", "JWT"));
        String payload = encodeJson(Map.of(
                "iss", jwtProperties.issuer(),
                "sub", user.getId().toString(),
                "email", user.getEmail(),
                "role", user.getRole().name(),
                "iat", issuedAt.getEpochSecond(),
                "exp", expiresAt.getEpochSecond()
        ));
        String signingInput = header + "." + payload;
        return new TokenResult(signingInput + "." + sign(signingInput), expiresAt);
    }

    public JwtPrincipal validateToken(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new UnauthorizedException("Invalid token");
        }

        String signingInput = parts[0] + "." + parts[1];
        if (!MessageDigest.isEqual(sign(signingInput).getBytes(StandardCharsets.UTF_8), parts[2].getBytes(StandardCharsets.UTF_8))) {
            throw new UnauthorizedException("Invalid token");
        }

        Map<String, Object> payload = decodeJson(parts[1]);
        if (!jwtProperties.issuer().equals(payload.get("iss"))) {
            throw new UnauthorizedException("Invalid token issuer");
        }

        Instant expiresAt = Instant.ofEpochSecond(requiredNumber(payload, "exp").longValue());
        if (!expiresAt.isAfter(Instant.now())) {
            throw new UnauthorizedException("Token expired");
        }

        return new JwtPrincipal(
                UUID.fromString(requiredString(payload, "sub")),
                requiredString(payload, "email"),
                UserRole.valueOf(requiredString(payload, "role"))
        );
    }

    private String encodeJson(Map<String, Object> value) {
        try {
            return URL_ENCODER.encodeToString(objectMapper.writeValueAsString(value).getBytes(StandardCharsets.UTF_8));
        } catch (JacksonException ex) {
            throw new IllegalStateException("Unable to create token", ex);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> decodeJson(String value) {
        try {
            String json = new String(URL_DECODER.decode(value), StandardCharsets.UTF_8);
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
            throw new IllegalStateException("Unable to sign token", ex);
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
