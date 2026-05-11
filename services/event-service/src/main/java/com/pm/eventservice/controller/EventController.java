package com.pm.eventservice.controller;

import com.pm.eventservice.dto.EventCreateRequestDTO;
import com.pm.eventservice.dto.EventDetailResponseDTO;
import com.pm.eventservice.dto.EventSummaryResponseDTO;
import com.pm.eventservice.dto.EventUpdateRequestDTO;
import com.pm.eventservice.exception.BadRequestException;
import com.pm.eventservice.exception.ForbiddenException;
import com.pm.eventservice.model.EventOutboxMessage;
import com.pm.eventservice.service.EventService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class EventController {
    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping("/internal/health")
    public Map<String, String> health() {
        return Map.of("status", "UP", "service", "event-service");
    }

    @GetMapping("/events")
    public List<EventSummaryResponseDTO> listPublishedEvents() {
        return eventService.listPublishedEvents();
    }

    @GetMapping("/events/{eventId}")
    public EventDetailResponseDTO getPublishedEvent(@PathVariable UUID eventId) {
        return eventService.getPublishedEvent(eventId);
    }

    @GetMapping("/organizer/events")
    public List<EventSummaryResponseDTO> listOrganizerEvents(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                                             @RequestHeader(name = "X-User-Role", required = false) String role) {
        return eventService.listOrganizerEvents(requireOrganizer(userId, role));
    }

    @PostMapping("/organizer/events")
    public ResponseEntity<EventDetailResponseDTO> createDraft(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                                              @RequestHeader(name = "X-User-Role", required = false) String role,
                                                              @Valid @RequestBody EventCreateRequestDTO request) {
        EventDetailResponseDTO response = eventService.createDraft(requireOrganizer(userId, role), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/organizer/events/{eventId}")
    public EventDetailResponseDTO updateDraft(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                              @RequestHeader(name = "X-User-Role", required = false) String role,
                                              @PathVariable UUID eventId,
                                              @Valid @RequestBody EventUpdateRequestDTO request) {
        return eventService.updateDraft(requireOrganizer(userId, role), eventId, request);
    }

    @PostMapping("/organizer/events/{eventId}/publish")
    public EventDetailResponseDTO publish(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                          @RequestHeader(name = "X-User-Role", required = false) String role,
                                          @PathVariable UUID eventId) {
        return eventService.publish(requireOrganizer(userId, role), eventId);
    }

    @PostMapping("/organizer/events/{eventId}/cancel")
    public EventDetailResponseDTO cancel(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                         @RequestHeader(name = "X-User-Role", required = false) String role,
                                         @PathVariable UUID eventId) {
        return eventService.cancel(requireOrganizer(userId, role), eventId);
    }

    @GetMapping("/internal/outbox/pending")
    public List<EventOutboxMessage> listPendingOutboxMessages() {
        return eventService.listPendingOutboxMessages();
    }

    private UUID requireOrganizer(String userId, String role) {
        if (!"ORGANIZER".equals(role)) {
            throw new ForbiddenException("Organizer role is required");
        }
        try {
            return UUID.fromString(userId);
        } catch (RuntimeException ex) {
            throw new BadRequestException("Valid X-User-Id header is required");
        }
    }
}
