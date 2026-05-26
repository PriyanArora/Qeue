package com.pm.notificationworker.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qeue.notification")
public class NotificationProperties {
    private boolean mailhogEnabled = false;
    private String mailhogHost = "localhost";
    private int mailhogPort = 1025;

    public boolean isMailhogEnabled() {
        return mailhogEnabled;
    }

    public void setMailhogEnabled(boolean mailhogEnabled) {
        this.mailhogEnabled = mailhogEnabled;
    }

    public String getMailhogHost() {
        return mailhogHost;
    }

    public void setMailhogHost(String mailhogHost) {
        this.mailhogHost = mailhogHost;
    }

    public int getMailhogPort() {
        return mailhogPort;
    }

    public void setMailhogPort(int mailhogPort) {
        this.mailhogPort = mailhogPort;
    }
}
