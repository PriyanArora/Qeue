package com.pm.notificationworker.service;

import com.pm.notificationworker.config.NotificationProperties;
import com.pm.notificationworker.messaging.RegistrationNotificationMessage;
import com.pm.notificationworker.model.NotificationTemplate;
import com.pm.notificationworker.model.NotificationStatus;
import com.pm.notificationworker.model.NotificationType;
import com.pm.notificationworker.repository.NotificationTemplateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class NotificationDeliveryService {
    private static final Logger log = LoggerFactory.getLogger(NotificationDeliveryService.class);

    private final NotificationProperties properties;
    private final JavaMailSender mailSender;
    private final NotificationTemplateRepository templateRepository;

    public NotificationDeliveryService(NotificationProperties properties,
                                       JavaMailSender mailSender,
                                       NotificationTemplateRepository templateRepository) {
        this.properties = properties;
        this.mailSender = mailSender;
        this.templateRepository = templateRepository;
    }

    public NotificationDeliveryResult deliver(NotificationType type, RegistrationNotificationMessage message) {
        String subject = render(subjectTemplateFor(type), message);
        String body = render(bodyTemplateFor(type), message);
        if (!properties.isMailhogEnabled()) {
            log.info(
                    "Notification recorded without SMTP action=notification_log_only type={} registrationId={} eventId={} recipient={}",
                    type,
                    message.registrationId(),
                    message.eventId(),
                    message.attendeeEmail()
            );
            return new NotificationDeliveryResult(NotificationStatus.SKIPPED, subject, body);
        }

        try {
            SimpleMailMessage email = new SimpleMailMessage();
            email.setTo(message.attendeeEmail());
            email.setFrom("noreply@qeue.local");
            email.setSubject(subject);
            email.setText(body);
            mailSender.send(email);
            return new NotificationDeliveryResult(NotificationStatus.SENT, subject, body);
        } catch (MailException ex) {
            log.warn(
                    "Notification delivery failed action=send_mailhog type={} registrationId={} eventId={} recipient={} reason={}",
                    type,
                    message.registrationId(),
                    message.eventId(),
                    message.attendeeEmail(),
                    ex.getMessage()
            );
            return new NotificationDeliveryResult(NotificationStatus.FAILED, subject, body);
        }
    }

    private String subjectTemplateFor(NotificationType type) {
        return templateRepository.findFirstByNotificationTypeAndActiveTrueOrderByUpdatedAtDesc(type)
                .map(NotificationTemplate::getSubjectTemplate)
                .orElseGet(() -> fallbackSubject(type));
    }

    private String bodyTemplateFor(NotificationType type) {
        return templateRepository.findFirstByNotificationTypeAndActiveTrueOrderByUpdatedAtDesc(type)
                .map(NotificationTemplate::getBodyTemplate)
                .orElseGet(() -> fallbackBody(type));
    }

    private String fallbackSubject(NotificationType type) {
        return switch (type) {
            case REGISTRATION_CONFIRMED -> "Registration confirmed: {{eventTitle}}";
            case REGISTRATION_CANCELLED -> "Registration cancelled: {{eventTitle}}";
            case CHECK_IN_CONFIRMATION -> "Checked in: {{eventTitle}}";
            case EVENT_CANCELLED -> "Event cancelled: {{eventTitle}}";
            case EVENT_REMINDER -> "Reminder: {{eventTitle}}";
            case SURVEY_REQUEST -> "Survey: {{eventTitle}}";
        };
    }

    private String fallbackBody(NotificationType type) {
        return switch (type) {
            case REGISTRATION_CONFIRMED -> "Your registration for {{eventTitle}} is confirmed.";
            case REGISTRATION_CANCELLED -> "Your registration for {{eventTitle}} was cancelled.";
            case CHECK_IN_CONFIRMATION -> "You are checked in for {{eventTitle}}.";
            case EVENT_CANCELLED -> "{{eventTitle}} was cancelled.";
            case EVENT_REMINDER -> "{{eventTitle}} starts at {{startsAt}}.";
            case SURVEY_REQUEST -> "Please submit feedback for {{eventTitle}}.";
        };
    }

    private String render(String template, RegistrationNotificationMessage message) {
        return template
                .replace("{{attendeeEmail}}", blank(message.attendeeEmail()))
                .replace("{{eventTitle}}", blank(message.eventTitle()))
                .replace("{{startsAt}}", blank(message.startsAt()))
                .replace("{{venueName}}", blank(message.venueName()))
                .replace("{{registrationTypeName}}", blank(message.registrationTypeName()));
    }

    private String blank(String value) {
        return value == null ? "" : value;
    }
}
