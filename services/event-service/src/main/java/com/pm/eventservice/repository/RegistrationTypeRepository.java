package com.pm.eventservice.repository;

import com.pm.eventservice.model.RegistrationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RegistrationTypeRepository extends JpaRepository<RegistrationType, UUID> {
    List<RegistrationType> findByEventIdOrderBySortOrderAsc(UUID eventId);

    List<RegistrationType> findByEventIdAndActiveTrueOrderBySortOrderAsc(UUID eventId);
}
