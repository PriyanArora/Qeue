package com.pm.eventservice.repository;

import com.pm.eventservice.model.RegistrationQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RegistrationQuestionRepository extends JpaRepository<RegistrationQuestion, UUID> {
    List<RegistrationQuestion> findByEventIdOrderBySortOrderAsc(UUID eventId);

    List<RegistrationQuestion> findByEventIdAndActiveTrueOrderBySortOrderAsc(UUID eventId);
}
