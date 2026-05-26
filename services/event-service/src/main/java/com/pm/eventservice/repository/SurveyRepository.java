package com.pm.eventservice.repository;

import com.pm.eventservice.model.Survey;
import com.pm.eventservice.model.SurveyStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SurveyRepository extends JpaRepository<Survey, UUID> {
    List<Survey> findByEventIdOrderByCreatedAtDesc(UUID eventId);

    Optional<Survey> findFirstByEventIdAndStatusOrderByCreatedAtDesc(UUID eventId, SurveyStatus status);
}
