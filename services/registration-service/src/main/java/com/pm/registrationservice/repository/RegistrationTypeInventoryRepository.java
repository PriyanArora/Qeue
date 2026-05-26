package com.pm.registrationservice.repository;

import com.pm.registrationservice.model.RegistrationTypeInventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RegistrationTypeInventoryRepository extends JpaRepository<RegistrationTypeInventory, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select inventory from RegistrationTypeInventory inventory where inventory.registrationTypeId = :registrationTypeId")
    Optional<RegistrationTypeInventory> findByRegistrationTypeIdForUpdate(@Param("registrationTypeId") UUID registrationTypeId);

    boolean existsByEventIdAndActiveTrue(UUID eventId);

    List<RegistrationTypeInventory> findByEventId(UUID eventId);
}
