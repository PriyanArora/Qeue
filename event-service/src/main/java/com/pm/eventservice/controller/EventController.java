package com.pm.eventservice.controller;

import com.pm.eventservice.dto.EventRequestDTO;
import com.pm.eventservice.dto.EventResponseDTO;
import com.pm.eventservice.dto.validators.CreateEventValidationGroups;
import com.pm.eventservice.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.groups.Default;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/events")
@Tag(name = "Event", description = "API for managing events")
public class EventController {
    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    @Operation(summary = "Get events")
    public ResponseEntity<List<EventResponseDTO>> getEvents() {
        List<EventResponseDTO> events = eventService.getEvents();
        return ResponseEntity.ok().body(events);
    }

    @PostMapping
    @Operation(summary = "Create a new event")
    public ResponseEntity<EventResponseDTO> createEvent(@Validated({Default.class, CreateEventValidationGroups.class}) @RequestBody EventRequestDTO eventRequestDTO) {
        EventResponseDTO eventResponseDTO = eventService.createEvent(eventRequestDTO);
        return ResponseEntity.ok().body(eventResponseDTO);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an event")
    public ResponseEntity<EventResponseDTO> updateEvent(@PathVariable UUID id, @Validated({Default.class}) @RequestBody EventRequestDTO eventRequestDTO) {
        EventResponseDTO eventResponseDTO = eventService.updateEvent(id, eventRequestDTO);
        return ResponseEntity.ok().body(eventResponseDTO);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an event")
    public ResponseEntity<Void> deleteEvent(@PathVariable UUID id) {
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }
}
