package com.pm.registrationservice.dto;

public record RegistrationTypeBreakdownDTO(
        String registrationTypeName,
        long confirmedCount
) {
}
