package com.pm.registrationservice.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SurveySubmissionResponseDTO(
        UUID submissionId,
        UUID surveyId,
        UUID eventId,
        UUID attendeeId,
        Instant submittedAt,
        List<SurveyAnswerDTO> answers
) {
}
