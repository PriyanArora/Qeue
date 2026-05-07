package com.pm.eventservice.exception;

public class EventTitleAlreadyExistsException extends RuntimeException {
    public EventTitleAlreadyExistsException(String message) {
        super(message);
    }
}
