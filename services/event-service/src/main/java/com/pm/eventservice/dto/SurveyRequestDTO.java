package com.pm.eventservice.dto;

import com.pm.eventservice.model.SurveyStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record SurveyRequestDTO(
        @NotBlank(message = "Title is required")
        @Size(max = 160, message = "Title cannot exceed 160 characters")
        String title,

        @NotNull(message = "Status is required")
        SurveyStatus status,

        @Valid
        List<SurveyQuestionRequestDTO> questions
) {
}
