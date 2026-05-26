package com.pm.registrationservice.model;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "registration_type_inventory")
public class RegistrationTypeInventory {
    @Id
    private UUID registrationTypeId;

    @Column(nullable = false)
    private UUID eventId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false)
    private Integer confirmedCount;

    @Column(nullable = false)
    private boolean active;

    @Version
    @Column(nullable = false)
    private Long version;

    public UUID getRegistrationTypeId() {
        return registrationTypeId;
    }

    public void setRegistrationTypeId(UUID registrationTypeId) {
        this.registrationTypeId = registrationTypeId;
    }

    public UUID getEventId() {
        return eventId;
    }

    public void setEventId(UUID eventId) {
        this.eventId = eventId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public Integer getConfirmedCount() {
        return confirmedCount;
    }

    public void setConfirmedCount(Integer confirmedCount) {
        this.confirmedCount = confirmedCount;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }
}
