package com.pm.registrationservice.controller;

import com.pm.registrationservice.dto.*;
import com.pm.registrationservice.exception.BadRequestException;
import com.pm.registrationservice.exception.ForbiddenException;
import com.pm.registrationservice.model.RegistrationOutboxMessage;
import com.pm.registrationservice.service.RegistrationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class RegistrationController {
    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @GetMapping("/internal/health")
    public Map<String, String> health() {
        return Map.of("status", "UP", "service", "registration-service");
    }

    @GetMapping("/me/registrations")
    public List<RegistrationResponseDTO> listMyRegistrations(@RequestHeader(name = "X-User-Id", required = false) String userId,
                                                             @RequestHeader(name = "X-User-Role", required = false) String role) {
        requireAttendee(role);
        return registrationService.listMyRegistrations(requireUserId(userId));
    }

    @PostMapping("/events/{eventId}/registrations")
    public ResponseEntity<RegistrationResponseDTO> register(@PathVariable UUID eventId,
                                                            @RequestHeader(name = "X-User-Id", required = false) String userId,
                                                            @RequestHeader(name = "X-User-Email", required = false) String userEmail,
                                                            @RequestHeader(name = "X-User-Role", required = false) String role,
                                                            @Valid @RequestBody RegistrationRequestDTO request) {
        requireAttendee(role);
        RegistrationResponseDTO response = registrationService.register(
                eventId,
                requireUserId(userId),
                requireUserEmail(userEmail),
                request
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/registrations/{registrationId}")
    public RegistrationResponseDTO cancel(@PathVariable UUID registrationId,
                                          @RequestHeader(name = "X-User-Id", required = false) String userId,
                                          @RequestHeader(name = "X-User-Role", required = false) String role) {
        requireAttendee(role);
        return registrationService.cancel(registrationId, requireUserId(userId));
    }

    @GetMapping("/me/registrations/{registrationId}/ticket")
    public TicketResponseDTO issueTicket(@PathVariable UUID registrationId,
                                         @RequestHeader(name = "X-User-Id", required = false) String userId,
                                         @RequestHeader(name = "X-User-Role", required = false) String role) {
        requireAttendee(role);
        return registrationService.issueTicket(registrationId, requireUserId(userId));
    }

    @GetMapping("/organizer/events/{eventId}/registrations")
    public List<OrganizerRegistrationResponseDTO> listOrganizerRegistrations(@PathVariable UUID eventId,
                                                                             @RequestHeader(name = "X-User-Id", required = false) String userId,
                                                                             @RequestHeader(name = "X-User-Role", required = false) String role,
                                                                             @RequestParam(required = false) String status,
                                                                             @RequestParam(required = false) UUID registrationTypeId,
                                                                             @RequestParam(required = false) String query,
                                                                             @RequestParam(required = false) String sort) {
        requireOrganizer(role);
        return registrationService.listOrganizerRegistrations(
                requireUserId(userId),
                eventId,
                parseRegistrationStatus(status),
                registrationTypeId,
                query,
                sort
        );
    }

    @GetMapping("/organizer/events/{eventId}/registrations/export.csv")
    public ResponseEntity<String> exportOrganizerRegistrations(@PathVariable UUID eventId,
                                                               @RequestHeader(name = "X-User-Id", required = false) String userId,
                                                               @RequestHeader(name = "X-User-Role", required = false) String role) {
        requireOrganizer(role);
        String csv = registrationService.exportOrganizerRegistrations(requireUserId(userId), eventId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"qeue-event-" + eventId + "-registrations.csv\"")
                .contentType(new MediaType("text", "csv"))
                .body(csv);
    }

    @GetMapping("/organizer/events/{eventId}/registrations/{registrationId}")
    public OrganizerRegistrationResponseDTO getOrganizerRegistration(@PathVariable UUID eventId,
                                                                     @PathVariable UUID registrationId,
                                                                     @RequestHeader(name = "X-User-Id", required = false) String userId,
                                                                     @RequestHeader(name = "X-User-Role", required = false) String role) {
        requireOrganizer(role);
        return registrationService.getOrganizerRegistration(requireUserId(userId), eventId, registrationId);
    }

    @PostMapping("/organizer/events/{eventId}/check-in")
    public CheckInResponseDTO checkIn(@PathVariable UUID eventId,
                                      @RequestHeader(name = "X-User-Id", required = false) String userId,
                                      @RequestHeader(name = "X-User-Role", required = false) String role,
                                      @Valid @RequestBody CheckInRequestDTO request) {
        requireOrganizer(role);
        return registrationService.checkIn(requireUserId(userId), eventId, request);
    }

    @GetMapping("/organizer/events/{eventId}/analytics")
    public EventAnalyticsResponseDTO analytics(@PathVariable UUID eventId,
                                               @RequestHeader(name = "X-User-Id", required = false) String userId,
                                               @RequestHeader(name = "X-User-Role", required = false) String role) {
        requireOrganizer(role);
        return registrationService.analytics(requireUserId(userId), eventId);
    }

    @PostMapping("/events/{eventId}/surveys/{surveyId}/responses")
    public ResponseEntity<SurveySubmissionResponseDTO> submitSurvey(@PathVariable UUID eventId,
                                                                    @PathVariable UUID surveyId,
                                                                    @RequestHeader(name = "X-User-Id", required = false) String userId,
                                                                    @RequestHeader(name = "X-User-Role", required = false) String role,
                                                                    @Valid @RequestBody SurveySubmissionRequestDTO request) {
        requireAttendee(role);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(registrationService.submitSurvey(eventId, surveyId, requireUserId(userId), request));
    }

    @GetMapping("/organizer/events/{eventId}/surveys/{surveyId}/responses")
    public List<SurveySubmissionResponseDTO> listSurveyResponses(@PathVariable UUID eventId,
                                                                 @PathVariable UUID surveyId,
                                                                 @RequestHeader(name = "X-User-Id", required = false) String userId,
                                                                 @RequestHeader(name = "X-User-Role", required = false) String role) {
        requireOrganizer(role);
        return registrationService.listSurveyResponses(requireUserId(userId), eventId, surveyId);
    }

    @GetMapping("/internal/outbox/pending")
    public List<RegistrationOutboxMessage> listPendingOutboxMessages() {
        return registrationService.listPendingOutboxMessages();
    }

    private UUID requireUserId(String userId) {
        try {
            return UUID.fromString(userId);
        } catch (RuntimeException ex) {
            throw new BadRequestException("Valid X-User-Id header is required");
        }
    }

    private String requireUserEmail(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            throw new BadRequestException("X-User-Email header is required");
        }
        return userEmail;
    }

    private void requireAttendee(String role) {
        if (!"ATTENDEE".equals(role)) {
            throw new ForbiddenException("Attendee role is required");
        }
    }

    private void requireOrganizer(String role) {
        if (!"ORGANIZER".equals(role)) {
            throw new ForbiddenException("Organizer role is required");
        }
    }

    private com.pm.registrationservice.model.RegistrationStatus parseRegistrationStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return com.pm.registrationservice.model.RegistrationStatus.valueOf(status);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Registration status filter is invalid");
        }
    }
}
