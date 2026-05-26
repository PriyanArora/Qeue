package com.pm.eventservice.repository;

import com.pm.eventservice.model.EventSession;
import com.pm.eventservice.model.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EventSessionRepository extends JpaRepository<EventSession, UUID> {
    List<EventSession> findByEventIdOrderByStartsAtAsc(UUID eventId);

    List<EventSession> findByEventIdAndStatusOrderByStartsAtAsc(UUID eventId, SessionStatus status);
}
