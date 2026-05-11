package com.pm.eventservice.service;

import com.pm.eventservice.dto.EventCreateRequestDTO;
import com.pm.eventservice.dto.EventDetailResponseDTO;
import com.pm.eventservice.dto.EventSummaryResponseDTO;
import com.pm.eventservice.dto.EventUpdateRequestDTO;
import com.pm.eventservice.exception.BadRequestException;
import com.pm.eventservice.exception.ConflictException;
import com.pm.eventservice.exception.EventNotFoundException;
import com.pm.eventservice.exception.ForbiddenException;
import com.pm.eventservice.mapper.EventMapper;
import com.pm.eventservice.model.Event;
import com.pm.eventservice.model.EventOutboxMessage;
import com.pm.eventservice.model.EventStatus;
import com.pm.eventservice.model.OutboxStatus;
import com.pm.eventservice.repository.EventOutboxRepository;
import com.pm.eventservice.repository.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class EventService {
    private final EventRepository eventRepository;
    private final EventOutboxRepository outboxRepository;
    private final ObjectMapper objectMapper;

    public EventService(EventRepository eventRepository,
                        EventOutboxRepository outboxRepository,
                        ObjectMapper objectMapper) {
        this.eventRepository = eventRepository;
        this.outboxRepository = outboxRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<EventSummaryResponseDTO> listPublishedEvents() {
        return eventRepository.findByStatusOrderByStartsAtAsc(EventStatus.PUBLISHED)
                .stream()
                .map(EventMapper::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public EventDetailResponseDTO getPublishedEvent(UUID eventId) {
        Event event = findEvent(eventId);
        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new EventNotFoundException("Published event not found with id " + eventId);
        }
        return EventMapper.toDetail(event);
    }

    @Transactional(readOnly = true)
    public List<EventSummaryResponseDTO> listOrganizerEvents(UUID organizerId) {
        return eventRepository.findByOrganizerIdOrderByStartsAtAsc(organizerId)
                .stream()
                .map(EventMapper::toSummary)
                .toList();
    }

    @Transactional
    public EventDetailResponseDTO createDraft(UUID organizerId, EventCreateRequestDTO request) {
        validateTimeRange(request.startsAt(), request.endsAt());

        Instant now = Instant.now();
        Event event = new Event();
        event.setOrganizerId(organizerId);
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setVenueName(request.venueName());
        event.setVenueCity(request.venueCity());
        event.setStartsAt(request.startsAt());
        event.setEndsAt(request.endsAt());
        event.setCapacity(request.capacity());
        event.setStatus(EventStatus.DRAFT);
        event.setCreatedAt(now);
        event.setUpdatedAt(now);

        return EventMapper.toDetail(eventRepository.save(event));
    }

    @Transactional
    public EventDetailResponseDTO updateDraft(UUID organizerId, UUID eventId, EventUpdateRequestDTO request) {
        validateTimeRange(request.startsAt(), request.endsAt());
        Event event = findOwnedEvent(organizerId, eventId);
        if (event.getStatus() != EventStatus.DRAFT) {
            throw new ConflictException("Only draft events can be updated");
        }

        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setVenueName(request.venueName());
        event.setVenueCity(request.venueCity());
        event.setStartsAt(request.startsAt());
        event.setEndsAt(request.endsAt());
        event.setCapacity(request.capacity());
        event.setUpdatedAt(Instant.now());

        return EventMapper.toDetail(eventRepository.save(event));
    }

    @Transactional
    public EventDetailResponseDTO publish(UUID organizerId, UUID eventId) {
        Event event = findOwnedEvent(organizerId, eventId);
        if (event.getStatus() != EventStatus.DRAFT) {
            throw new ConflictException("Only draft events can be published");
        }
        validateTimeRange(event.getStartsAt(), event.getEndsAt());
        if (event.getCapacity() == null || event.getCapacity() < 1) {
            throw new ConflictException("Event capacity must be at least 1 before publishing");
        }

        event.setStatus(EventStatus.PUBLISHED);
        event.setUpdatedAt(Instant.now());
        Event saved = eventRepository.save(event);
        createOutboxMessage(saved, "EventPublished");
        return EventMapper.toDetail(saved);
    }

    @Transactional
    public EventDetailResponseDTO cancel(UUID organizerId, UUID eventId) {
        Event event = findOwnedEvent(organizerId, eventId);
        if (event.getStatus() == EventStatus.CANCELLED) {
            return EventMapper.toDetail(event);
        }

        event.setStatus(EventStatus.CANCELLED);
        event.setUpdatedAt(Instant.now());
        Event saved = eventRepository.save(event);
        createOutboxMessage(saved, "EventCancelled");
        return EventMapper.toDetail(saved);
    }

    @Transactional(readOnly = true)
    public List<EventOutboxMessage> listPendingOutboxMessages() {
        return outboxRepository.findByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING);
    }

    private Event findEvent(UUID eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException("Event not found with id " + eventId));
    }

    private Event findOwnedEvent(UUID organizerId, UUID eventId) {
        Event event = findEvent(eventId);
        if (!event.getOrganizerId().equals(organizerId)) {
            throw new ForbiddenException("Organizer does not own this event");
        }
        return event;
    }

    private void validateTimeRange(Instant startsAt, Instant endsAt) {
        if (startsAt == null || endsAt == null) {
            throw new BadRequestException("Start and end times are required");
        }
        if (!endsAt.isAfter(startsAt)) {
            throw new BadRequestException("End time must be after start time");
        }
    }

    private void createOutboxMessage(Event event, String eventType) {
        EventOutboxMessage message = new EventOutboxMessage();
        message.setAggregateId(event.getId());
        message.setEventType(eventType);
        message.setPayloadJson(toPayloadJson(event, eventType));
        message.setStatus(OutboxStatus.PENDING);
        message.setCreatedAt(Instant.now());
        outboxRepository.save(message);
    }

    private String toPayloadJson(Event event, String eventType) {
        try {
            return objectMapper.writeValueAsString(Map.of(
                    "eventType", eventType,
                    "eventId", event.getId(),
                    "organizerId", event.getOrganizerId(),
                    "title", event.getTitle(),
                    "startsAt", event.getStartsAt(),
                    "capacity", event.getCapacity(),
                    "status", event.getStatus().name()
            ));
        } catch (JacksonException ex) {
            throw new IllegalStateException("Unable to serialize event outbox payload", ex);
        }
    }
}
