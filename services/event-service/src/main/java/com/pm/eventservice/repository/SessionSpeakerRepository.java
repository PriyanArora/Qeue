package com.pm.eventservice.repository;

import com.pm.eventservice.model.SessionSpeaker;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface SessionSpeakerRepository extends JpaRepository<SessionSpeaker, UUID> {
    List<SessionSpeaker> findBySessionId(UUID sessionId);

    List<SessionSpeaker> findBySessionIdIn(Collection<UUID> sessionIds);

    void deleteBySessionId(UUID sessionId);
}
