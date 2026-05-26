package com.pm.notificationworker.repository;

import com.pm.notificationworker.model.NotificationLog;
import com.pm.notificationworker.model.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationLogRepository extends JpaRepository<NotificationLog, UUID> {
    boolean existsByRegistrationIdAndNotificationType(UUID registrationId, NotificationType notificationType);

    Optional<NotificationLog> findByRegistrationIdAndNotificationType(UUID registrationId, NotificationType notificationType);

    List<NotificationLog> findAllByOrderByCreatedAtDesc();
}
