package com.pm.eventservice.dto;

import com.pm.eventservice.model.SurveyStatus;

import java.util.List;
import java.util.UUID;

public record SurveyResponseDTO(
        UUID id,
        UUID eventId,
        String title,
        SurveyStatus status,
        List<SurveyQuestionResponseDTO> questions
) {
}
