package com.pm.notificationworker.service;

import com.pm.notificationworker.model.NotificationStatus;

public record NotificationDeliveryResult(
        NotificationStatus status,
        String subject,
        String body
) {
}
