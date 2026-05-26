package com.pm.eventservice.dto;

import com.pm.eventservice.model.QuestionType;

import java.util.UUID;

public record SurveyQuestionResponseDTO(
        UUID id,
        UUID surveyId,
        String questionText,
        QuestionType questionType,
        boolean required,
        Integer sortOrder
) {
}
