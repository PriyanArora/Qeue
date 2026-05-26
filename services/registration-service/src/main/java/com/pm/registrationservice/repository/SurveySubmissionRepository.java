package com.pm.registrationservice.repository;

import com.pm.registrationservice.model.SurveySubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SurveySubmissionRepository extends JpaRepository<SurveySubmission, UUID> {
    boolean existsBySurveyIdAndAttendeeId(UUID surveyId, UUID attendeeId);

    Optional<SurveySubmission> findBySurveyIdAndAttendeeId(UUID surveyId, UUID attendeeId);

    List<SurveySubmission> findByEventIdAndSurveyIdOrderBySubmittedAtDesc(UUID eventId, UUID surveyId);
}
