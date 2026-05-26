package com.pm.registrationservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qeue.rabbitmq")
public class RegistrationRabbitProperties {
    private String exchange = "qeue.events";
    private String eventPublishedRoutingKey = "event.published.v1";
    private String eventCancelledRoutingKey = "event.cancelled.v1";
    private String registrationConfirmedRoutingKey = "registration.confirmed.v1";
    private String registrationCancelledRoutingKey = "registration.cancelled.v1";
    private String checkInCompletedRoutingKey = "checkin.completed.v1";
    private String inventoryQueue = "registration.event-inventory";
    private String inventoryDeadLetterExchange = "qeue.events.dlx";
    private String inventoryDeadLetterQueue = "registration.event-inventory.dlq";
    private String inventoryDeadLetterRoutingKey = "registration.event-inventory.failed";
    private boolean listenerEnabled = false;
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

    public String getRegistrationConfirmedRoutingKey() {
        return registrationConfirmedRoutingKey;
    }

    public void setRegistrationConfirmedRoutingKey(String registrationConfirmedRoutingKey) {
        this.registrationConfirmedRoutingKey = registrationConfirmedRoutingKey;
    }

    public String getRegistrationCancelledRoutingKey() {
        return registrationCancelledRoutingKey;
    }

    public void setRegistrationCancelledRoutingKey(String registrationCancelledRoutingKey) {
        this.registrationCancelledRoutingKey = registrationCancelledRoutingKey;
    }

    public String getCheckInCompletedRoutingKey() {
        return checkInCompletedRoutingKey;
    }

    public void setCheckInCompletedRoutingKey(String checkInCompletedRoutingKey) {
        this.checkInCompletedRoutingKey = checkInCompletedRoutingKey;
    }

    public String getInventoryQueue() {
        return inventoryQueue;
    }

    public void setInventoryQueue(String inventoryQueue) {
        this.inventoryQueue = inventoryQueue;
    }

    public String getInventoryDeadLetterExchange() {
        return inventoryDeadLetterExchange;
    }

    public void setInventoryDeadLetterExchange(String inventoryDeadLetterExchange) {
        this.inventoryDeadLetterExchange = inventoryDeadLetterExchange;
    }

    public String getInventoryDeadLetterQueue() {
        return inventoryDeadLetterQueue;
    }

    public void setInventoryDeadLetterQueue(String inventoryDeadLetterQueue) {
        this.inventoryDeadLetterQueue = inventoryDeadLetterQueue;
    }

    public String getInventoryDeadLetterRoutingKey() {
        return inventoryDeadLetterRoutingKey;
    }

    public void setInventoryDeadLetterRoutingKey(String inventoryDeadLetterRoutingKey) {
        this.inventoryDeadLetterRoutingKey = inventoryDeadLetterRoutingKey;
    }

    public boolean isListenerEnabled() {
        return listenerEnabled;
    }

    public void setListenerEnabled(boolean listenerEnabled) {
        this.listenerEnabled = listenerEnabled;
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
