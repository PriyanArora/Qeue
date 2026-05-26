package com.pm.eventservice.service;

import com.pm.eventservice.dto.EventRequestDTO;
import com.pm.eventservice.dto.EventResponseDTO;
import com.pm.eventservice.exception.EventNotFoundException;
import com.pm.eventservice.exception.EventTitleAlreadyExistsException;
import com.pm.eventservice.mapper.EventMapper;
import com.pm.eventservice.model.Event;
import com.pm.eventservice.repository.EventRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class EventService {
    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public List<EventResponseDTO> getEvents() {
        List<Event> events = eventRepository.findAll();

        return events.stream()
                .map(EventMapper::toDTO).toList();
    }

    public EventResponseDTO createEvent(EventRequestDTO eventRequestDTO) {
        if (eventRepository.existsByTitle(eventRequestDTO.getTitle())) {
            throw new EventTitleAlreadyExistsException("An event with this title already exists " + eventRequestDTO.getTitle());
        }

        Event newEvent = eventRepository.save(EventMapper.toModel(eventRequestDTO));

        return EventMapper.toDTO(newEvent);
    }

    public EventResponseDTO updateEvent(UUID id, EventRequestDTO eventRequestDTO) {
        Event event = eventRepository.findById(id).orElseThrow(() -> new EventNotFoundException("Event not found with ID " + id));

        if (eventRepository.existsByTitleAndIdNot(eventRequestDTO.getTitle(), id)) {
            throw new EventTitleAlreadyExistsException("An event with this title already exists " + eventRequestDTO.getTitle());
        }

        event.setTitle(eventRequestDTO.getTitle());
        event.setVenue(eventRequestDTO.getVenue());
        event.setOrganizerEmail(eventRequestDTO.getOrganizerEmail());
        event.setEventDate(LocalDate.parse(eventRequestDTO.getEventDate()));

        Event updatedEvent = eventRepository.save(event);
        return EventMapper.toDTO(updatedEvent);
    }

    public void deleteEvent(UUID id) {
        if (!eventRepository.existsById(id)) {
            throw new EventNotFoundException("Event not found with ID " + id);
        }
        eventRepository.deleteById(id);
    }
}
