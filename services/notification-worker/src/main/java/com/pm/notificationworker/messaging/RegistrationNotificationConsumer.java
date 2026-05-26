package com.pm.notificationworker.messaging;

import com.pm.notificationworker.service.NotificationService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Component
public class RegistrationNotificationConsumer {
    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    public RegistrationNotificationConsumer(ObjectMapper objectMapper,
                                            NotificationService notificationService) {
        this.objectMapper = objectMapper;
        this.notificationService = notificationService;
    }

    @RabbitListener(
            queues = "${qeue.rabbitmq.notification-queue}",
            autoStartup = "${qeue.rabbitmq.listener-enabled:false}"
    )
    public void consumeRegistrationMessage(String payloadJson) {
        notificationService.handleRegistrationMessage(readMessage(payloadJson));
    }

    private RegistrationNotificationMessage readMessage(String payloadJson) {
        try {
            return objectMapper.readValue(payloadJson, RegistrationNotificationMessage.class);
        } catch (JacksonException ex) {
            throw new IllegalArgumentException("Unable to read registration notification message", ex);
        }
    }
}
