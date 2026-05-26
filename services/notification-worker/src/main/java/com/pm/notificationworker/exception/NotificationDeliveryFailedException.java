package com.pm.notificationworker.exception;

public class NotificationDeliveryFailedException extends RuntimeException {
    public NotificationDeliveryFailedException(String message) {
        super(message);
    }
}
