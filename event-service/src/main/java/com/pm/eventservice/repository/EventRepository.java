package com.pm.eventservice.repository;

import com.pm.eventservice.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {
    boolean existsByTitle(String title);

    boolean existsByTitleAndIdNot(String title, UUID id);
}
