package com.pm.registrationservice.repository;

import com.pm.registrationservice.model.OutboxStatus;
import com.pm.registrationservice.model.RegistrationOutboxMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RegistrationOutboxRepository extends JpaRepository<RegistrationOutboxMessage, UUID> {
    List<RegistrationOutboxMessage> findByStatusOrderByCreatedAtAsc(OutboxStatus status);
}
