package com.pm.eventservice.dto;

import com.pm.eventservice.dto.validators.CreateEventValidationGroups;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class EventRequestDTO {

    @NotBlank(message = "Title is required")
    @Size(max = 100,  message= "Title cannot exceed 100 characters")
    private String title;

    @NotBlank(message = "Organizer email is required")
    @Email(message = "Organizer email should be valid")
    private String organizerEmail;

    @NotBlank(message = "Venue is required")
    private String venue;

    @NotBlank(message = "Event date is required")
    private String eventDate;

    @NotBlank(groups = CreateEventValidationGroups.class, message = "Created date is required")
    private String createdDate;

    public String getVenue() {
        return venue;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }

    public String getEventDate() {
        return eventDate;
    }

    public void setEventDate(String eventDate) {
        this.eventDate = eventDate;
    }

    public String getOrganizerEmail() {
        return organizerEmail;
    }

    public void setOrganizerEmail(String organizerEmail) {
        this.organizerEmail = organizerEmail;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(String createdDate) {
        this.createdDate = createdDate;
    }
}
