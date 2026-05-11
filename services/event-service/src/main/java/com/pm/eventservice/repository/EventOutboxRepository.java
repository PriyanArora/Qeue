package com.pm.eventservice.repository;

import com.pm.eventservice.model.EventOutboxMessage;
import com.pm.eventservice.model.OutboxStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventOutboxRepository extends JpaRepository<EventOutboxMessage, UUID> {
    List<EventOutboxMessage> findByStatusOrderByCreatedAtAsc(OutboxStatus status);
}
