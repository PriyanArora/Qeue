package com.pm.identityservice.dto;

import java.time.Instant;
import java.util.Map;

public record ApiErrorDTO(
        Instant timestamp,
        int status,
        String error,
        String message,
        Map<String, String> fields
) {
}
