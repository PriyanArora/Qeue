package com.pm.registrationservice.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record RegistrationAnswerDTO(
        @NotNull(message = "Question id is required")
        UUID questionId,

        @Size(max = 4000, message = "Answer cannot exceed 4000 characters")
        String answerText
) {
}
