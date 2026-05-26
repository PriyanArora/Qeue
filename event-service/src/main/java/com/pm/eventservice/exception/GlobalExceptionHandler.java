package com.pm.eventservice.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationException(MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getFieldErrors().forEach(
                error -> errors.put(error.getField(), error.getDefaultMessage()));

        return ResponseEntity.badRequest().body(errors);
    }

    @ExceptionHandler(EventTitleAlreadyExistsException.class)
    public ResponseEntity<Map<String,String>> handleEventTitleAlreadyExistsException(EventTitleAlreadyExistsException ex) {

        log.warn("Event title already exists {} " , ex.getMessage());
        Map<String, String> errors = new HashMap<>();
        errors.put("message", "Event title already exists");
        return ResponseEntity.badRequest().body(errors);
    }

    @ExceptionHandler(EventNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleEventNotFoundException(EventNotFoundException ex) {

        log.warn("Event not found {} ", ex.getMessage());
        Map<String, String> errors = new HashMap<>();
        errors.put("message", "Event not found");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errors);
    }

    @ExceptionHandler(DateTimeParseException.class)
    public ResponseEntity<Map<String, String>> handleDateTimeParseException(DateTimeParseException ex) {

        log.warn("Invalid event date {}", ex.getParsedString());
        Map<String, String> errors = new HashMap<>();
        errors.put("message", "Event date must use ISO format yyyy-MM-dd");
        return ResponseEntity.badRequest().body(errors);
    }
}
