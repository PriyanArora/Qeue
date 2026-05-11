package com.pm.registrationservice.service;

import com.pm.registrationservice.dto.RegistrationRequestDTO;
import com.pm.registrationservice.dto.RegistrationResponseDTO;
import com.pm.registrationservice.exception.ConflictException;
import com.pm.registrationservice.exception.ForbiddenException;
import com.pm.registrationservice.exception.NotFoundException;
import com.pm.registrationservice.model.*;
import com.pm.registrationservice.repository.EventInventoryRepository;
import com.pm.registrationservice.repository.RegistrationOutboxRepository;
import com.pm.registrationservice.repository.RegistrationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class RegistrationService {
    private final EventInventoryRepository inventoryRepository;
    private final RegistrationRepository registrationRepository;
    private final RegistrationOutboxRepository outboxRepository;
    private final ObjectMapper objectMapper;

    public RegistrationService(EventInventoryRepository inventoryRepository,
                               RegistrationRepository registrationRepository,
                               RegistrationOutboxRepository outboxRepository,
                               ObjectMapper objectMapper) {
        this.inventoryRepository = inventoryRepository;
        this.registrationRepository = registrationRepository;
        this.outboxRepository = outboxRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<RegistrationResponseDTO> listMyRegistrations(UUID attendeeId) {
        return registrationRepository.findByAttendeeIdOrderByCreatedAtDesc(attendeeId)
                .stream()
                .map(registration -> toResponse(registration, findInventory(registration.getEventId())))
                .toList();
    }

    @Transactional
    public RegistrationResponseDTO register(UUID eventId,
                                            UUID attendeeId,
                                            String attendeeEmail,
                                            RegistrationRequestDTO request) {
        var existing = registrationRepository.findByAttendeeIdAndIdempotencyKey(attendeeId, request.idempotencyKey());
        if (existing.isPresent()) {
            Registration registration = existing.get();
            return toResponse(registration, findInventory(registration.getEventId()));
        }

        EventInventory inventory = inventoryRepository.findByEventIdForUpdate(eventId)
                .orElseThrow(() -> new NotFoundException("Event inventory not found"));

        if (inventory.getEventStatus() != EventStatus.PUBLISHED) {
            throw new ConflictException("Event is not available for registration");
        }
        if (inventory.getConfirmedCount() >= inventory.getCapacity()) {
            throw new ConflictException("Event is sold out");
        }
        if (registrationRepository.existsByEventIdAndAttendeeIdAndStatus(eventId, attendeeId, RegistrationStatus.CONFIRMED)) {
            throw new ConflictException("Attendee is already registered for this event");
        }

        Instant now = Instant.now();
        Registration registration = new Registration();
        registration.setEventId(eventId);
        registration.setAttendeeId(attendeeId);
        registration.setAttendeeEmail(attendeeEmail);
        registration.setStatus(RegistrationStatus.CONFIRMED);
        registration.setIdempotencyKey(request.idempotencyKey());
        registration.setActiveRegistrationKey(RegistrationStatus.CONFIRMED.name());
        registration.setCreatedAt(now);

        inventory.setConfirmedCount(inventory.getConfirmedCount() + 1);
        inventoryRepository.save(inventory);
        Registration saved = registrationRepository.save(registration);
        createOutboxMessage(saved, inventory, "RegistrationConfirmed");
        return toResponse(saved, inventory);
    }

    @Transactional
    public RegistrationResponseDTO cancel(UUID registrationId, UUID attendeeId) {
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new NotFoundException("Registration not found"));
        if (!registration.getAttendeeId().equals(attendeeId)) {
            throw new ForbiddenException("Cannot cancel another attendee's registration");
        }
        EventInventory inventory = inventoryRepository.findByEventIdForUpdate(registration.getEventId())
                .orElseThrow(() -> new NotFoundException("Event inventory not found"));

        if (registration.getStatus() == RegistrationStatus.CANCELLED) {
            return toResponse(registration, inventory);
        }

        registration.setStatus(RegistrationStatus.CANCELLED);
        registration.setCancelledAt(Instant.now());
        registration.setActiveRegistrationKey(null);
        inventory.setConfirmedCount(Math.max(0, inventory.getConfirmedCount() - 1));
        inventoryRepository.save(inventory);
        Registration saved = registrationRepository.save(registration);
        createOutboxMessage(saved, inventory, "RegistrationCancelled");
        return toResponse(saved, inventory);
    }

    @Transactional(readOnly = true)
    public List<RegistrationOutboxMessage> listPendingOutboxMessages() {
        return outboxRepository.findByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING);
    }

    private EventInventory findInventory(UUID eventId) {
        return inventoryRepository.findById(eventId)
                .orElseThrow(() -> new NotFoundException("Event inventory not found"));
    }

    private RegistrationResponseDTO toResponse(Registration registration, EventInventory inventory) {
        return new RegistrationResponseDTO(
                registration.getId(),
                registration.getEventId(),
                inventory.getTitle(),
                inventory.getStartsAt(),
                registration.getAttendeeId(),
                registration.getAttendeeEmail(),
                registration.getStatus(),
                registration.getCreatedAt(),
                registration.getCancelledAt()
        );
    }

    private void createOutboxMessage(Registration registration, EventInventory inventory, String eventType) {
        RegistrationOutboxMessage message = new RegistrationOutboxMessage();
        message.setAggregateId(registration.getId());
        message.setEventType(eventType);
        message.setPayloadJson(toPayloadJson(registration, inventory, eventType));
        message.setStatus(OutboxStatus.PENDING);
        message.setCreatedAt(Instant.now());
        outboxRepository.save(message);
    }

    private String toPayloadJson(Registration registration, EventInventory inventory, String eventType) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("eventType", eventType);
        payload.put("registrationId", registration.getId());
        payload.put("eventId", registration.getEventId());
        payload.put("eventTitle", inventory.getTitle());
        payload.put("attendeeId", registration.getAttendeeId());
        payload.put("attendeeEmail", registration.getAttendeeEmail());
        payload.put("status", registration.getStatus().name());
        payload.put("createdAt", registration.getCreatedAt());
        if (registration.getCancelledAt() != null) {
            payload.put("cancelledAt", registration.getCancelledAt());
        }

        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JacksonException ex) {
            throw new IllegalStateException("Unable to serialize registration outbox payload", ex);
        }
    }
}
