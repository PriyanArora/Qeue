package com.pm.registrationservice.config;

import org.springframework.amqp.core.*;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@EnableConfigurationProperties(RegistrationRabbitProperties.class)
public class RegistrationRabbitConfig {

    @Bean
    TopicExchange eventExchange(RegistrationRabbitProperties properties) {
        return new TopicExchange(properties.getExchange(), true, false);
    }

    @Bean
    DirectExchange inventoryDeadLetterExchange(RegistrationRabbitProperties properties) {
        return new DirectExchange(properties.getInventoryDeadLetterExchange(), true, false);
    }

    @Bean
    Queue inventoryQueue(RegistrationRabbitProperties properties) {
        return QueueBuilder.durable(properties.getInventoryQueue())
                .deadLetterExchange(properties.getInventoryDeadLetterExchange())
                .deadLetterRoutingKey(properties.getInventoryDeadLetterRoutingKey())
                .build();
    }

    @Bean
    Queue inventoryDeadLetterQueue(RegistrationRabbitProperties properties) {
        return QueueBuilder.durable(properties.getInventoryDeadLetterQueue()).build();
    }

    @Bean
    Binding eventPublishedInventoryBinding(Queue inventoryQueue,
                                           TopicExchange eventExchange,
                                           RegistrationRabbitProperties properties) {
        return BindingBuilder.bind(inventoryQueue)
                .to(eventExchange)
                .with(properties.getEventPublishedRoutingKey());
    }

    @Bean
    Binding eventCancelledInventoryBinding(Queue inventoryQueue,
                                           TopicExchange eventExchange,
                                           RegistrationRabbitProperties properties) {
        return BindingBuilder.bind(inventoryQueue)
                .to(eventExchange)
                .with(properties.getEventCancelledRoutingKey());
    }

    @Bean
    Binding inventoryDeadLetterBinding(Queue inventoryDeadLetterQueue,
                                       DirectExchange inventoryDeadLetterExchange,
                                       RegistrationRabbitProperties properties) {
        return BindingBuilder.bind(inventoryDeadLetterQueue)
                .to(inventoryDeadLetterExchange)
                .with(properties.getInventoryDeadLetterRoutingKey());
    }
}
