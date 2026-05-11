package com.pm.registrationservice.repository;

import com.pm.registrationservice.model.EventInventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface EventInventoryRepository extends JpaRepository<EventInventory, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select inventory from EventInventory inventory where inventory.eventId = :eventId")
    Optional<EventInventory> findByEventIdForUpdate(@Param("eventId") UUID eventId);
}
