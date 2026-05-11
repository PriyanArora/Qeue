package com.pm.registrationservice.controller;

import com.pm.registrationservice.dto.RegistrationRequestDTO;
import com.pm.registrationservice.dto.RegistrationResponseDTO;
import com.pm.registrationservice.exception.BadRequestException;
import com.pm.registrationservice.model.RegistrationOutboxMessage;
import com.pm.registrationservice.service.RegistrationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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
    public List<RegistrationResponseDTO> listMyRegistrations(@RequestHeader(name = "X-User-Id", required = false) String userId) {
        return registrationService.listMyRegistrations(requireUserId(userId));
    }

    @PostMapping("/events/{eventId}/registrations")
    public ResponseEntity<RegistrationResponseDTO> register(@PathVariable UUID eventId,
                                                            @RequestHeader(name = "X-User-Id", required = false) String userId,
                                                            @RequestHeader(name = "X-User-Email", required = false) String userEmail,
                                                            @Valid @RequestBody RegistrationRequestDTO request) {
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
                                          @RequestHeader(name = "X-User-Id", required = false) String userId) {
        return registrationService.cancel(registrationId, requireUserId(userId));
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
}
