package com.pm.eventservice.mapper;

import com.pm.eventservice.dto.EventDetailResponseDTO;
import com.pm.eventservice.dto.EventSummaryResponseDTO;
import com.pm.eventservice.model.Event;

public final class EventMapper {
    private EventMapper() {
    }

    public static EventSummaryResponseDTO toSummary(Event event) {
        return new EventSummaryResponseDTO(
                event.getId(),
                event.getOrganizerId(),
                event.getTitle(),
                event.getVenueName(),
                event.getVenueCity(),
                event.getStartsAt(),
                event.getEndsAt(),
                event.getCapacity(),
                event.getStatus()
        );
    }

    public static EventDetailResponseDTO toDetail(Event event) {
        return new EventDetailResponseDTO(
                event.getId(),
                event.getOrganizerId(),
                event.getTitle(),
                event.getDescription(),
                event.getVenueName(),
                event.getVenueCity(),
                event.getStartsAt(),
                event.getEndsAt(),
                event.getCapacity(),
                event.getStatus(),
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }
}
