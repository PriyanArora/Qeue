package com.pm.registrationservice.dto;

import java.util.List;

public record EventAnalyticsResponseDTO(
        int capacity,
        long confirmedRegistrations,
        long cancelledRegistrations,
        long availableSeats,
        long checkIns,
        long noShows,
        List<RegistrationTypeBreakdownDTO> registrationTypeBreakdown
) {
}
