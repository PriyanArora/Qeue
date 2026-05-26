package com.pm.eventservice.dto;

import com.pm.eventservice.model.SessionStatus;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SessionRequestDTO(
        @NotBlank(message = "Title is required")
        @Size(max = 160, message = "Title cannot exceed 160 characters")
        String title,

        @NotBlank(message = "Description is required")
        @Size(max = 4000, message = "Description cannot exceed 4000 characters")
        String description,

        @NotNull(message = "Start time is required")
        @Future(message = "Start time must be in the future")
        Instant startsAt,

        @NotNull(message = "End time is required")
        @Future(message = "End time must be in the future")
        Instant endsAt,

        @NotBlank(message = "Room name is required")
        @Size(max = 120, message = "Room name cannot exceed 120 characters")
        String roomName,

        @NotNull(message = "Capacity is required")
        @Min(value = 1, message = "Capacity must be at least 1")
        Integer capacity,

        @NotNull(message = "Status is required")
        SessionStatus status,

        List<UUID> speakerIds
) {
}
