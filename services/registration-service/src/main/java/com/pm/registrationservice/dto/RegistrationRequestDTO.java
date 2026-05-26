package com.pm.registrationservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record RegistrationRequestDTO(
        @NotBlank(message = "Idempotency key is required")
        @Size(max = 120, message = "Idempotency key must be 120 characters or fewer")
        String idempotencyKey,

        UUID registrationTypeId,

        List<RegistrationAnswerDTO> answers
) {
}
