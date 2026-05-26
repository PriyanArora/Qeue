package com.pm.notificationworker.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qeue.rabbitmq")
public class NotificationRabbitProperties {
    private String exchange = "qeue.events";
    private String registrationConfirmedRoutingKey = "registration.confirmed.v1";
    private String registrationCancelledRoutingKey = "registration.cancelled.v1";
    private String checkInCompletedRoutingKey = "checkin.completed.v1";
    private String notificationQueue = "notification.registration-events";
    private String notificationDeadLetterExchange = "qeue.notifications.dlx";
    private String notificationDeadLetterQueue = "notification.registration-events.dlq";
    private String notificationDeadLetterRoutingKey = "notification.registration-events.failed";

    public String getExchange() {
        return exchange;
    }

    public void setExchange(String exchange) {
        this.exchange = exchange;
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

    public String getNotificationQueue() {
        return notificationQueue;
    }

    public void setNotificationQueue(String notificationQueue) {
        this.notificationQueue = notificationQueue;
    }

    public String getNotificationDeadLetterExchange() {
        return notificationDeadLetterExchange;
    }

    public void setNotificationDeadLetterExchange(String notificationDeadLetterExchange) {
        this.notificationDeadLetterExchange = notificationDeadLetterExchange;
    }

    public String getNotificationDeadLetterQueue() {
        return notificationDeadLetterQueue;
    }

    public void setNotificationDeadLetterQueue(String notificationDeadLetterQueue) {
        this.notificationDeadLetterQueue = notificationDeadLetterQueue;
    }

    public String getNotificationDeadLetterRoutingKey() {
        return notificationDeadLetterRoutingKey;
    }

    public void setNotificationDeadLetterRoutingKey(String notificationDeadLetterRoutingKey) {
        this.notificationDeadLetterRoutingKey = notificationDeadLetterRoutingKey;
    }
}
