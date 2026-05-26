package com.pm.registrationservice.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "survey_submissions",
        uniqueConstraints = @UniqueConstraint(name = "uk_survey_submission_attendee",
                columnNames = {"survey_id", "attendee_id"}))
public class SurveySubmission {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID surveyId;

    @Column(nullable = false)
    private UUID eventId;

    @Column(nullable = false)
    private UUID attendeeId;

    @Column(nullable = false)
    private Instant submittedAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getSurveyId() {
        return surveyId;
    }

    public void setSurveyId(UUID surveyId) {
        this.surveyId = surveyId;
    }

    public UUID getEventId() {
        return eventId;
    }

    public void setEventId(UUID eventId) {
        this.eventId = eventId;
    }

    public UUID getAttendeeId() {
        return attendeeId;
    }

    public void setAttendeeId(UUID attendeeId) {
        this.attendeeId = attendeeId;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
    }
}
