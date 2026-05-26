package com.pm.registrationservice.repository;

import com.pm.registrationservice.model.SurveyAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface SurveyAnswerRepository extends JpaRepository<SurveyAnswer, UUID> {
    List<SurveyAnswer> findBySubmissionId(UUID submissionId);

    List<SurveyAnswer> findBySubmissionIdIn(Collection<UUID> submissionIds);
}
