package com.pm.registrationservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CheckInRequestDTO(
        @NotBlank(message = "Ticket code is required")
        @Size(max = 80, message = "Ticket code cannot exceed 80 characters")
        String ticketCode
) {
}
