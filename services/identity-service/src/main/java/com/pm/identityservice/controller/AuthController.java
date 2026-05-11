package com.pm.identityservice.controller;

import com.pm.identityservice.dto.AuthResponseDTO;
import com.pm.identityservice.dto.LoginRequestDTO;
import com.pm.identityservice.dto.RegisterRequestDTO;
import com.pm.identityservice.dto.UserResponseDTO;
import com.pm.identityservice.security.JwtPrincipal;
import com.pm.identityservice.service.IdentityService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {
    private final IdentityService identityService;

    public AuthController(IdentityService identityService) {
        this.identityService = identityService;
    }

    @GetMapping("/internal/health")
    public Map<String, String> health() {
        return Map.of("status", "UP", "service", "identity-service");
    }

    @PostMapping("/auth/register")
    public ResponseEntity<AuthResponseDTO> register(@Valid @RequestBody RegisterRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(identityService.register(request));
    }

    @PostMapping("/auth/login")
    public AuthResponseDTO login(@Valid @RequestBody LoginRequestDTO request) {
        return identityService.login(request);
    }

    @GetMapping("/auth/me")
    public UserResponseDTO me(@AuthenticationPrincipal JwtPrincipal principal) {
        return identityService.getCurrentUser(principal.userId());
    }
}
