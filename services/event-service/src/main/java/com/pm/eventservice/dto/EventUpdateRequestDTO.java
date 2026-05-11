package com.pm.eventservice.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record EventUpdateRequestDTO(
        @NotBlank(message = "Title is required")
        @Size(max = 120, message = "Title cannot exceed 120 characters")
        String title,

        @NotBlank(message = "Description is required")
        @Size(max = 4000, message = "Description cannot exceed 4000 characters")
        String description,

        @NotBlank(message = "Venue name is required")
        @Size(max = 160, message = "Venue name cannot exceed 160 characters")
        String venueName,

        @NotBlank(message = "Venue city is required")
        @Size(max = 120, message = "Venue city cannot exceed 120 characters")
        String venueCity,

        @NotNull(message = "Start time is required")
        @Future(message = "Start time must be in the future")
        Instant startsAt,

        @NotNull(message = "End time is required")
        @Future(message = "End time must be in the future")
        Instant endsAt,

        @NotNull(message = "Capacity is required")
        @Min(value = 1, message = "Capacity must be at least 1")
        Integer capacity
) {
}
