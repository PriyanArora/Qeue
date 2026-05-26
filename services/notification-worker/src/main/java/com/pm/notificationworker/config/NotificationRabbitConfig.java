package com.pm.notificationworker.config;

import org.springframework.amqp.core.*;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({NotificationRabbitProperties.class, NotificationProperties.class})
public class NotificationRabbitConfig {

    @Bean
    TopicExchange eventExchange(NotificationRabbitProperties properties) {
        return new TopicExchange(properties.getExchange(), true, false);
    }

    @Bean
    DirectExchange notificationDeadLetterExchange(NotificationRabbitProperties properties) {
        return new DirectExchange(properties.getNotificationDeadLetterExchange(), true, false);
    }

    @Bean
    Queue notificationQueue(NotificationRabbitProperties properties) {
        return QueueBuilder.durable(properties.getNotificationQueue())
                .deadLetterExchange(properties.getNotificationDeadLetterExchange())
                .deadLetterRoutingKey(properties.getNotificationDeadLetterRoutingKey())
                .build();
    }

    @Bean
    Queue notificationDeadLetterQueue(NotificationRabbitProperties properties) {
        return QueueBuilder.durable(properties.getNotificationDeadLetterQueue()).build();
    }

    @Bean
    Binding registrationConfirmedBinding(Queue notificationQueue,
                                         TopicExchange eventExchange,
                                         NotificationRabbitProperties properties) {
        return BindingBuilder.bind(notificationQueue)
                .to(eventExchange)
                .with(properties.getRegistrationConfirmedRoutingKey());
    }

    @Bean
    Binding registrationCancelledBinding(Queue notificationQueue,
                                         TopicExchange eventExchange,
                                         NotificationRabbitProperties properties) {
        return BindingBuilder.bind(notificationQueue)
                .to(eventExchange)
                .with(properties.getRegistrationCancelledRoutingKey());
    }

    @Bean
    Binding checkInCompletedBinding(Queue notificationQueue,
                                    TopicExchange eventExchange,
                                    NotificationRabbitProperties properties) {
        return BindingBuilder.bind(notificationQueue)
                .to(eventExchange)
                .with(properties.getCheckInCompletedRoutingKey());
    }

    @Bean
    Binding notificationDeadLetterBinding(Queue notificationDeadLetterQueue,
                                          DirectExchange notificationDeadLetterExchange,
                                          NotificationRabbitProperties properties) {
        return BindingBuilder.bind(notificationDeadLetterQueue)
                .to(notificationDeadLetterExchange)
                .with(properties.getNotificationDeadLetterRoutingKey());
    }
}
