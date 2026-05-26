package com.pm.registrationservice.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "registrations")
public class Registration {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID eventId;

    @Column(nullable = false)
    private UUID attendeeId;

    @Column(nullable = false, length = 320)
    private String attendeeEmail;

    @Column(nullable = false, length = 160)
    private String attendeeDisplayNameSnapshot;

    private UUID registrationTypeId;

    @Column(length = 120)
    private String registrationTypeNameSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RegistrationStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CheckInStatus checkInStatus;

    private Instant checkedInAt;

    private UUID checkedInByOrganizerId;

    @Column(length = 128)
    private String ticketCodeHash;

    private Instant ticketCodeIssuedAt;

    @Column(nullable = false, length = 120)
    private String idempotencyKey;

    @Column(length = 30)
    private String activeRegistrationKey;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant cancelledAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getEventId() {
        return eventId;
    }

    public void setEventId(UUID eventId) {
        this.eventId = eventId;
    }

    public UUID getAttendeeId() {
        return attendeeId;
    }

    public void setAttendeeId(UUID attendeeId) {
        this.attendeeId = attendeeId;
    }

    public String getAttendeeEmail() {
        return attendeeEmail;
    }

    public void setAttendeeEmail(String attendeeEmail) {
        this.attendeeEmail = attendeeEmail;
    }

    public String getAttendeeDisplayNameSnapshot() {
        return attendeeDisplayNameSnapshot;
    }

    public void setAttendeeDisplayNameSnapshot(String attendeeDisplayNameSnapshot) {
        this.attendeeDisplayNameSnapshot = attendeeDisplayNameSnapshot;
    }

    public UUID getRegistrationTypeId() {
        return registrationTypeId;
    }

    public void setRegistrationTypeId(UUID registrationTypeId) {
        this.registrationTypeId = registrationTypeId;
    }

    public String getRegistrationTypeNameSnapshot() {
        return registrationTypeNameSnapshot;
    }

    public void setRegistrationTypeNameSnapshot(String registrationTypeNameSnapshot) {
        this.registrationTypeNameSnapshot = registrationTypeNameSnapshot;
    }

    public RegistrationStatus getStatus() {
        return status;
    }

    public void setStatus(RegistrationStatus status) {
        this.status = status;
    }

    public CheckInStatus getCheckInStatus() {
        return checkInStatus;
    }

    public void setCheckInStatus(CheckInStatus checkInStatus) {
        this.checkInStatus = checkInStatus;
    }

    public Instant getCheckedInAt() {
        return checkedInAt;
    }

    public void setCheckedInAt(Instant checkedInAt) {
        this.checkedInAt = checkedInAt;
    }

    public UUID getCheckedInByOrganizerId() {
        return checkedInByOrganizerId;
    }

    public void setCheckedInByOrganizerId(UUID checkedInByOrganizerId) {
        this.checkedInByOrganizerId = checkedInByOrganizerId;
    }

    public String getTicketCodeHash() {
        return ticketCodeHash;
    }

    public void setTicketCodeHash(String ticketCodeHash) {
        this.ticketCodeHash = ticketCodeHash;
    }

    public Instant getTicketCodeIssuedAt() {
        return ticketCodeIssuedAt;
    }

    public void setTicketCodeIssuedAt(Instant ticketCodeIssuedAt) {
        this.ticketCodeIssuedAt = ticketCodeIssuedAt;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public String getActiveRegistrationKey() {
        return activeRegistrationKey;
    }

    public void setActiveRegistrationKey(String activeRegistrationKey) {
        this.activeRegistrationKey = activeRegistrationKey;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(Instant cancelledAt) {
        this.cancelledAt = cancelledAt;
    }
}
