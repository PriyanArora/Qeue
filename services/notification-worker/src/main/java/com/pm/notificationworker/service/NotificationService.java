package com.pm.notificationworker.service;

import com.pm.notificationworker.dto.NotificationLogResponseDTO;
import com.pm.notificationworker.exception.NotificationDeliveryFailedException;
import com.pm.notificationworker.messaging.RegistrationNotificationMessage;
import com.pm.notificationworker.model.NotificationLog;
import com.pm.notificationworker.model.NotificationStatus;
import com.pm.notificationworker.model.NotificationType;
import com.pm.notificationworker.repository.NotificationLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationLogRepository notificationLogRepository;
    private final NotificationDeliveryService deliveryService;

    public NotificationService(NotificationLogRepository notificationLogRepository,
                               NotificationDeliveryService deliveryService) {
        this.notificationLogRepository = notificationLogRepository;
        this.deliveryService = deliveryService;
    }

    @Transactional(noRollbackFor = NotificationDeliveryFailedException.class)
    public NotificationLogResponseDTO handleRegistrationMessage(RegistrationNotificationMessage message) {
        NotificationType notificationType = notificationTypeFor(message.eventType());
        validate(message);

        return notificationLogRepository
                .findByRegistrationIdAndNotificationType(message.registrationId(), notificationType)
                .map(this::toResponse)
                .orElseGet(() -> createNotificationLog(message, notificationType));
    }

    @Transactional(readOnly = true)
    public List<NotificationLogResponseDTO> listNotificationLogs() {
        return notificationLogRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private NotificationLogResponseDTO createNotificationLog(RegistrationNotificationMessage message,
                                                             NotificationType notificationType) {
        NotificationDeliveryResult delivery = deliveryService.deliver(notificationType, message);

        NotificationLog notificationLog = new NotificationLog();
        notificationLog.setRegistrationId(message.registrationId());
        notificationLog.setEventId(message.eventId());
        notificationLog.setRecipientEmail(message.attendeeEmail());
        notificationLog.setNotificationType(notificationType);
        notificationLog.setStatus(delivery.status());
        notificationLog.setMessageId(message.registrationId() + ":" + notificationType);
        notificationLog.setRenderedSubject(delivery.subject());
        notificationLog.setRenderedBody(delivery.body());
        notificationLog.setCreatedAt(Instant.now());

        NotificationLog saved = notificationLogRepository.save(notificationLog);
        log.info(
                "Stored notification log action=create_notification_log type={} registrationId={} eventId={} status={}",
                notificationType,
                message.registrationId(),
                message.eventId(),
                delivery.status()
        );

        if (delivery.status() == NotificationStatus.FAILED) {
            throw new NotificationDeliveryFailedException("Notification delivery failed for " + message.registrationId());
        }
        return toResponse(saved);
    }

    private NotificationType notificationTypeFor(String eventType) {
        return switch (eventType) {
            case "RegistrationConfirmed" -> NotificationType.REGISTRATION_CONFIRMED;
            case "RegistrationCancelled" -> NotificationType.REGISTRATION_CANCELLED;
            case "CheckInCompleted" -> NotificationType.CHECK_IN_CONFIRMATION;
            default -> throw new IllegalArgumentException("Unsupported notification event type " + eventType);
        };
    }

    private void validate(RegistrationNotificationMessage message) {
        if (message.registrationId() == null) {
            throw new IllegalArgumentException("Registration notification requires registrationId");
        }
        if (message.eventId() == null) {
            throw new IllegalArgumentException("Registration notification requires eventId");
        }
        if (message.eventTitle() == null || message.eventTitle().isBlank()) {
            throw new IllegalArgumentException("Registration notification requires eventTitle");
        }
        if (message.attendeeEmail() == null || message.attendeeEmail().isBlank()) {
            throw new IllegalArgumentException("Registration notification requires attendeeEmail");
        }
    }

    private NotificationLogResponseDTO toResponse(NotificationLog notificationLog) {
        return new NotificationLogResponseDTO(
                notificationLog.getId(),
                notificationLog.getRegistrationId(),
                notificationLog.getEventId(),
                notificationLog.getRecipientEmail(),
                notificationLog.getNotificationType(),
                notificationLog.getStatus(),
                notificationLog.getMessageId(),
                notificationLog.getRenderedSubject(),
                notificationLog.getRenderedBody(),
                notificationLog.getCreatedAt()
        );
    }
}
