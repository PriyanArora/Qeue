package com.pm.registrationservice.dto;

import java.time.Instant;
import java.util.UUID;

public record TicketResponseDTO(
        UUID registrationId,
        UUID eventId,
        String ticketCode,
        Instant issuedAt
) {
}
