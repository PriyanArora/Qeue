package com.pm.registrationservice.repository;

import com.pm.registrationservice.model.Registration;
import com.pm.registrationservice.model.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RegistrationRepository extends JpaRepository<Registration, UUID> {
    boolean existsByEventIdAndAttendeeIdAndStatus(UUID eventId, UUID attendeeId, RegistrationStatus status);

    Optional<Registration> findByAttendeeIdAndIdempotencyKey(UUID attendeeId, String idempotencyKey);

    Optional<Registration> findByIdAndAttendeeId(UUID id, UUID attendeeId);

    List<Registration> findByAttendeeIdOrderByCreatedAtDesc(UUID attendeeId);
}
