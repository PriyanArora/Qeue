package com.pm.notificationworker.repository;

import com.pm.notificationworker.model.NotificationTemplate;
import com.pm.notificationworker.model.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, UUID> {
    Optional<NotificationTemplate> findFirstByNotificationTypeAndActiveTrueOrderByUpdatedAtDesc(NotificationType notificationType);
}
