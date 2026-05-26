package com.pm.notificationworker.controller;

import com.pm.notificationworker.dto.NotificationLogResponseDTO;
import com.pm.notificationworker.service.NotificationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/internal/health")
    public Map<String, String> health() {
        return Map.of("status", "UP", "service", "notification-worker");
    }

    @GetMapping("/internal/notifications")
    public List<NotificationLogResponseDTO> listNotificationLogs() {
        return notificationService.listNotificationLogs();
    }
}
