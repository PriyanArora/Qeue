package com.pm.eventservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qeue.rabbitmq")
public class EventRabbitProperties {
    private String exchange = "qeue.events";
    private String eventPublishedRoutingKey = "event.published.v1";
    private String eventCancelledRoutingKey = "event.cancelled.v1";
    private boolean publisherEnabled = false;
    private long publisherFixedDelayMs = 5000;

    public String getExchange() {
        return exchange;
    }

    public void setExchange(String exchange) {
        this.exchange = exchange;
    }

    public String getEventPublishedRoutingKey() {
        return eventPublishedRoutingKey;
    }

    public void setEventPublishedRoutingKey(String eventPublishedRoutingKey) {
        this.eventPublishedRoutingKey = eventPublishedRoutingKey;
    }

    public String getEventCancelledRoutingKey() {
        return eventCancelledRoutingKey;
    }

    public void setEventCancelledRoutingKey(String eventCancelledRoutingKey) {
        this.eventCancelledRoutingKey = eventCancelledRoutingKey;
    }

    public boolean isPublisherEnabled() {
        return publisherEnabled;
    }

    public void setPublisherEnabled(boolean publisherEnabled) {
        this.publisherEnabled = publisherEnabled;
    }

    public long getPublisherFixedDelayMs() {
        return publisherFixedDelayMs;
    }

    public void setPublisherFixedDelayMs(long publisherFixedDelayMs) {
        this.publisherFixedDelayMs = publisherFixedDelayMs;
    }
}
