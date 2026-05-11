package com.pm.identityservice.service;

import com.pm.identityservice.dto.AuthResponseDTO;
import com.pm.identityservice.dto.LoginRequestDTO;
import com.pm.identityservice.dto.RegisterRequestDTO;
import com.pm.identityservice.dto.UserResponseDTO;
import com.pm.identityservice.exception.ConflictException;
import com.pm.identityservice.exception.UnauthorizedException;
import com.pm.identityservice.model.User;
import com.pm.identityservice.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Service
public class IdentityService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public IdentityService(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           TokenService tokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    @Transactional
    public AuthResponseDTO register(RegisterRequestDTO request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email is already registered");
        }

        Instant now = Instant.now();
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setDisplayName(request.displayName().trim());
        user.setRole(request.role());
        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        return toAuthResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public AuthResponseDTO login(LoginRequestDTO request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }
        return toAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponseDTO getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Current user no longer exists"));
        return new UserResponseDTO(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole());
    }

    private AuthResponseDTO toAuthResponse(User user) {
        TokenResult tokenResult = tokenService.createToken(user);
        return new AuthResponseDTO(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getRole(),
                "Bearer",
                tokenResult.accessToken(),
                tokenResult.expiresAt()
        );
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
