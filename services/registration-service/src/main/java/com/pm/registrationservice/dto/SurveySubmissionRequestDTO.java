package com.pm.registrationservice.dto;

import jakarta.validation.Valid;

import java.util.List;

public record SurveySubmissionRequestDTO(
        @Valid
        List<SurveyAnswerDTO> answers
) {
}
