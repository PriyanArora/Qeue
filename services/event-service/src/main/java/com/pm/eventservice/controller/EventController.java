package com.pm.eventservice.controller;

import com.pm.eventservice.dto.*;
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

    @GetMapping("/events/{eventId}/registration-questions")
    public List<RegistrationQuestionResponseDTO> listPublicQuestions(@PathVariable UUID eventId) {
        return eventService.listPublicQuestions(eventId);
    }

    @GetMapping("/events/{eventId}/registration-types")
    public List<RegistrationTypeResponseDTO> listPublicTypes(@PathVariable UUID eventId) {
        return eventService.listPublicTypes(eventId);
    }

    @GetMapping("/events/{eventId}/speakers")
    public List<SpeakerResponseDTO> listPublicSpeakers(@PathVariable UUID eventId) {
        return eventService.listPublicSpeakers(eventId);
    }

    @GetMapping("/events/{eventId}/sessions")
    public List<SessionResponseDTO> listPublicSessions(@PathVariable UUID eventId) {
        return eventService.listPublicSessions(eventId);
    }

    @GetMapping("/events/{eventId}/surveys/active")
    public SurveyResponseDTO getActiveSurvey(@PathVariable UUID eventId) {
        return eventService.getActiveSurvey(eventId);
    }

    @GetMapping("/organizer/events")
    public List<EventSummaryResponseDTO> listOrganizerEvents(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                                             @RequestHeader(name = "X-User-Role", required = false) String role) {
        return eventService.listOrganizerEvents(requireOrganizer(userId, role));
    }

    @GetMapping("/organizer/events/{eventId}")
    public EventDetailResponseDTO getOrganizerEvent(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                                    @RequestHeader(name = "X-User-Role", required = false) String role,
                                                    @PathVariable UUID eventId) {
        return eventService.getOrganizerEvent(requireOrganizer(userId, role), eventId);
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

    @GetMapping("/organizer/events/{eventId}/registration-questions")
    public List<RegistrationQuestionResponseDTO> listOrganizerQuestions(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                                                        @RequestHeader(name = "X-User-Role", required = false) String role,
                                                                        @PathVariable UUID eventId) {
        return eventService.listOrganizerQuestions(requireOrganizer(userId, role), eventId);
    }

    @PostMapping("/organizer/events/{eventId}/registration-questions")
    public ResponseEntity<RegistrationQuestionResponseDTO> createQuestion(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                                                          @RequestHeader(name = "X-User-Role", required = false) String role,
                                                                          @PathVariable UUID eventId,
                                                                          @Valid @RequestBody RegistrationQuestionRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createQuestion(requireOrganizer(userId, role), eventId, request));
    }

    @PutMapping("/organizer/events/{eventId}/registration-questions/{questionId}")
    public RegistrationQuestionResponseDTO updateQuestion(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                                          @RequestHeader(name = "X-User-Role", required = false) String role,
                                                          @PathVariable UUID eventId,
                                                          @PathVariable UUID questionId,
                                                          @Valid @RequestBody RegistrationQuestionRequestDTO request) {
        return eventService.updateQuestion(requireOrganizer(userId, role), eventId, questionId, request);
    }

    @DeleteMapping("/organizer/events/{eventId}/registration-questions/{questionId}")
    public ResponseEntity<Void> deactivateQuestion(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                                   @RequestHeader(name = "X-User-Role", required = false) String role,
                                                   @PathVariable UUID eventId,
                                                   @PathVariable UUID questionId) {
        eventService.deactivateQuestion(requireOrganizer(userId, role), eventId, questionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/organizer/events/{eventId}/registration-types")
    public List<RegistrationTypeResponseDTO> listOrganizerTypes(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                                                @RequestHeader(name = "X-User-Role", required = false) String role,
                                                                @PathVariable UUID eventId) {
        return eventService.listOrganizerTypes(requireOrganizer(userId, role), eventId);
    }

    @PostMapping("/organizer/events/{eventId}/registration-types")
    public ResponseEntity<RegistrationTypeResponseDTO> createType(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                                                  @RequestHeader(name = "X-User-Role", required = false) String role,
                                                                  @PathVariable UUID eventId,
                                                                  @Valid @RequestBody RegistrationTypeRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createType(requireOrganizer(userId, role), eventId, request));
    }

    @PutMapping("/organizer/events/{eventId}/registration-types/{typeId}")
    public RegistrationTypeResponseDTO updateType(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                                  @RequestHeader(name = "X-User-Role", required = false) String role,
                                                  @PathVariable UUID eventId,
                                                  @PathVariable UUID typeId,
                                                  @Valid @RequestBody RegistrationTypeRequestDTO request) {
        return eventService.updateType(requireOrganizer(userId, role), eventId, typeId, request);
    }

    @DeleteMapping("/organizer/events/{eventId}/registration-types/{typeId}")
    public ResponseEntity<Void> deactivateType(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                               @RequestHeader(name = "X-User-Role", required = false) String role,
                                               @PathVariable UUID eventId,
                                               @PathVariable UUID typeId) {
        eventService.deactivateType(requireOrganizer(userId, role), eventId, typeId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/organizer/events/{eventId}/speakers")
    public List<SpeakerResponseDTO> listOrganizerSpeakers(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                                          @RequestHeader(name = "X-User-Role", required = false) String role,
                                                          @PathVariable UUID eventId) {
        return eventService.listOrganizerSpeakers(requireOrganizer(userId, role), eventId);
    }

    @PostMapping("/organizer/events/{eventId}/speakers")
    public ResponseEntity<SpeakerResponseDTO> createSpeaker(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                                            @RequestHeader(name = "X-User-Role", required = false) String role,
                                                            @PathVariable UUID eventId,
                                                            @Valid @RequestBody SpeakerRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createSpeaker(requireOrganizer(userId, role), eventId, request));
    }

    @PutMapping("/organizer/events/{eventId}/speakers/{speakerId}")
    public SpeakerResponseDTO updateSpeaker(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                            @RequestHeader(name = "X-User-Role", required = false) String role,
                                            @PathVariable UUID eventId,
                                            @PathVariable UUID speakerId,
                                            @Valid @RequestBody SpeakerRequestDTO request) {
        return eventService.updateSpeaker(requireOrganizer(userId, role), eventId, speakerId, request);
    }

    @DeleteMapping("/organizer/events/{eventId}/speakers/{speakerId}")
    public ResponseEntity<Void> deleteSpeaker(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                              @RequestHeader(name = "X-User-Role", required = false) String role,
                                              @PathVariable UUID eventId,
                                              @PathVariable UUID speakerId) {
        eventService.deleteSpeaker(requireOrganizer(userId, role), eventId, speakerId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/organizer/events/{eventId}/sessions")
    public List<SessionResponseDTO> listOrganizerSessions(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                                          @RequestHeader(name = "X-User-Role", required = false) String role,
                                                          @PathVariable UUID eventId) {
        return eventService.listOrganizerSessions(requireOrganizer(userId, role), eventId);
    }

    @PostMapping("/organizer/events/{eventId}/sessions")
    public ResponseEntity<SessionResponseDTO> createSession(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                                            @RequestHeader(name = "X-User-Role", required = false) String role,
                                                            @PathVariable UUID eventId,
                                                            @Valid @RequestBody SessionRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createSession(requireOrganizer(userId, role), eventId, request));
    }

    @PutMapping("/organizer/events/{eventId}/sessions/{sessionId}")
    public SessionResponseDTO updateSession(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                            @RequestHeader(name = "X-User-Role", required = false) String role,
                                            @PathVariable UUID eventId,
                                            @PathVariable UUID sessionId,
                                            @Valid @RequestBody SessionRequestDTO request) {
        return eventService.updateSession(requireOrganizer(userId, role), eventId, sessionId, request);
    }

    @DeleteMapping("/organizer/events/{eventId}/sessions/{sessionId}")
    public ResponseEntity<Void> deleteSession(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                              @RequestHeader(name = "X-User-Role", required = false) String role,
                                              @PathVariable UUID eventId,
                                              @PathVariable UUID sessionId) {
        eventService.deleteSession(requireOrganizer(userId, role), eventId, sessionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/organizer/events/{eventId}/surveys")
    public List<SurveyResponseDTO> listOrganizerSurveys(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                                        @RequestHeader(name = "X-User-Role", required = false) String role,
                                                        @PathVariable UUID eventId) {
        return eventService.listOrganizerSurveys(requireOrganizer(userId, role), eventId);
    }

    @PostMapping("/organizer/events/{eventId}/surveys")
    public ResponseEntity<SurveyResponseDTO> createSurvey(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                                          @RequestHeader(name = "X-User-Role", required = false) String role,
                                                          @PathVariable UUID eventId,
                                                          @Valid @RequestBody SurveyRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createSurvey(requireOrganizer(userId, role), eventId, request));
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
