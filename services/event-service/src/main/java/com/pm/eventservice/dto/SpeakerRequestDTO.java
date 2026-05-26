package com.pm.eventservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SpeakerRequestDTO(
        @NotBlank(message = "Name is required")
        @Size(max = 160, message = "Name cannot exceed 160 characters")
        String name,

        @NotBlank(message = "Title is required")
        @Size(max = 160, message = "Title cannot exceed 160 characters")
        String title,

        @NotBlank(message = "Organization is required")
        @Size(max = 160, message = "Organization cannot exceed 160 characters")
        String organization,

        @NotBlank(message = "Bio is required")
        @Size(max = 4000, message = "Bio cannot exceed 4000 characters")
        String bio,

        @Size(max = 500, message = "Photo URL cannot exceed 500 characters")
        String photoUrl
) {
}
