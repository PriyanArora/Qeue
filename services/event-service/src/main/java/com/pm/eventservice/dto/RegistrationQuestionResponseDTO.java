package com.pm.eventservice.dto;

import com.pm.eventservice.model.QuestionType;

import java.util.UUID;

public record RegistrationQuestionResponseDTO(
        UUID id,
        UUID eventId,
        String questionText,
        QuestionType questionType,
        boolean required,
        Integer sortOrder,
        boolean active
) {
}
