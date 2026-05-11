package com.pm.eventservice.repository;

import com.pm.eventservice.model.Event;
import com.pm.eventservice.model.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {
    List<Event> findByStatusOrderByStartsAtAsc(EventStatus status);

    List<Event> findByOrganizerIdOrderByStartsAtAsc(UUID organizerId);
}
