package com.pm.notificationworker.exception;

import com.pm.notificationworker.dto.ApiErrorDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorDTO> handleBadMessage(IllegalArgumentException ex) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(NotificationDeliveryFailedException.class)
    public ResponseEntity<ApiErrorDTO> handleDeliveryFailure(NotificationDeliveryFailedException ex) {
        return error(HttpStatus.SERVICE_UNAVAILABLE, "Notification delivery failed");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorDTO> handleUnexpected(Exception ex) {
        log.error("Unexpected notification-worker error", ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected server error");
    }

    private ResponseEntity<ApiErrorDTO> error(HttpStatus status, String message) {
        return ResponseEntity.status(status)
                .body(new ApiErrorDTO(Instant.now(), status.value(), status.getReasonPhrase(), message));
    }
}
