package com.pm.eventservice.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@EnableConfigurationProperties(EventRabbitProperties.class)
public class EventRabbitConfig {

    @Bean
    TopicExchange eventExchange(EventRabbitProperties properties) {
        return new TopicExchange(properties.getExchange(), true, false);
    }
}
