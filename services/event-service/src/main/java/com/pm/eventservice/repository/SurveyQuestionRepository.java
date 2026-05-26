package com.pm.eventservice.repository;

import com.pm.eventservice.model.SurveyQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface SurveyQuestionRepository extends JpaRepository<SurveyQuestion, UUID> {
    List<SurveyQuestion> findBySurveyIdOrderBySortOrderAsc(UUID surveyId);

    List<SurveyQuestion> findBySurveyIdIn(Collection<UUID> surveyIds);

    void deleteBySurveyId(UUID surveyId);
}
