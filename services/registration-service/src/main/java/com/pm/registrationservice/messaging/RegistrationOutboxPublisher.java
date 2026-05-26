package com.pm.registrationservice.messaging;

import com.pm.registrationservice.config.RegistrationRabbitProperties;
import com.pm.registrationservice.model.OutboxStatus;
import com.pm.registrationservice.model.RegistrationOutboxMessage;
import com.pm.registrationservice.repository.RegistrationOutboxRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
public class RegistrationOutboxPublisher {
    private static final Logger log = LoggerFactory.getLogger(RegistrationOutboxPublisher.class);

    private final RegistrationOutboxRepository outboxRepository;
    private final RabbitTemplate rabbitTemplate;
    private final RegistrationRabbitProperties properties;

    public RegistrationOutboxPublisher(RegistrationOutboxRepository outboxRepository,
                                       RabbitTemplate rabbitTemplate,
                                       RegistrationRabbitProperties properties) {
        this.outboxRepository = outboxRepository;
        this.rabbitTemplate = rabbitTemplate;
        this.properties = properties;
    }

    @Scheduled(fixedDelayString = "${qeue.rabbitmq.publisher-fixed-delay-ms:5000}")
    public void publishPendingIfEnabled() {
        if (properties.isPublisherEnabled()) {
            publishPending();
        }
    }

    @Transactional
    public int publishPending() {
        int publishedCount = 0;
        for (RegistrationOutboxMessage message : outboxRepository.findByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING)) {
            if (publishOne(message)) {
                publishedCount++;
            }
        }
        return publishedCount;
    }

    private boolean publishOne(RegistrationOutboxMessage message) {
        try {
            rabbitTemplate.convertAndSend(
                    properties.getExchange(),
                    routingKeyFor(message),
                    message.getPayloadJson(),
                    rabbitMessage -> {
                        MessageProperties messageProperties = rabbitMessage.getMessageProperties();
                        messageProperties.setMessageId(message.getId().toString());
                        messageProperties.setContentType(MessageProperties.CONTENT_TYPE_JSON);
                        messageProperties.setHeader("eventType", message.getEventType());
                        messageProperties.setHeader("aggregateId", message.getAggregateId().toString());
                        return rabbitMessage;
                    }
            );
            message.setStatus(OutboxStatus.PUBLISHED);
            message.setPublishedAt(Instant.now());
            outboxRepository.save(message);
            return true;
        } catch (AmqpException | IllegalArgumentException ex) {
            message.setStatus(OutboxStatus.FAILED);
            outboxRepository.save(message);
            log.warn(
                    "Failed to publish registration outbox message action=publish_outbox messageId={} aggregateId={} eventType={} reason={}",
                    message.getId(),
                    message.getAggregateId(),
                    message.getEventType(),
                    ex.getMessage()
            );
            return false;
        }
    }

    private String routingKeyFor(RegistrationOutboxMessage message) {
        return switch (message.getEventType()) {
            case "RegistrationConfirmed" -> properties.getRegistrationConfirmedRoutingKey();
            case "RegistrationCancelled" -> properties.getRegistrationCancelledRoutingKey();
            case "CheckInCompleted" -> properties.getCheckInCompletedRoutingKey();
            default -> throw new IllegalArgumentException("Unsupported registration outbox type " + message.getEventType());
        };
    }
}
