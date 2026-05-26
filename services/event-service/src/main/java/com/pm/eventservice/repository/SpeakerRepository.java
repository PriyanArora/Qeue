package com.pm.eventservice.repository;

import com.pm.eventservice.model.Speaker;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface SpeakerRepository extends JpaRepository<Speaker, UUID> {
    List<Speaker> findByEventIdOrderByNameAsc(UUID eventId);

    List<Speaker> findByIdIn(Collection<UUID> ids);
}
