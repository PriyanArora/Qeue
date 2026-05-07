package com.pm.eventservice.mapper;

import com.pm.eventservice.dto.EventRequestDTO;
import com.pm.eventservice.dto.EventResponseDTO;
import com.pm.eventservice.model.Event;

import java.time.LocalDate;

public class EventMapper {
    public static EventResponseDTO toDTO(Event event) {
        EventResponseDTO eventDTO = new EventResponseDTO();
        eventDTO.setId(event.getId().toString());
        eventDTO.setTitle(event.getTitle());
        eventDTO.setVenue(event.getVenue());
        eventDTO.setOrganizerEmail(event.getOrganizerEmail());
        eventDTO.setEventDate(event.getEventDate().toString());
        return eventDTO;
    }

    public static Event toModel(EventRequestDTO eventRequestDTO) {
        Event event = new Event();
        event.setTitle(eventRequestDTO.getTitle());
        event.setVenue(eventRequestDTO.getVenue());
        event.setOrganizerEmail(eventRequestDTO.getOrganizerEmail());
        event.setEventDate(LocalDate.parse(eventRequestDTO.getEventDate()));
        event.setCreatedDate(LocalDate.parse(eventRequestDTO.getCreatedDate()));
        return event;
    }
}
