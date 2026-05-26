package com.pm.eventservice.dto;

import com.pm.eventservice.model.QuestionType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegistrationQuestionRequestDTO(
        @NotBlank(message = "Question text is required")
        @Size(max = 500, message = "Question text cannot exceed 500 characters")
        String questionText,

        @NotNull(message = "Question type is required")
        QuestionType questionType,

        boolean required,

        @NotNull(message = "Sort order is required")
        @Min(value = 0, message = "Sort order cannot be negative")
        Integer sortOrder,

        boolean active
) {
}
