package com.pm.registrationservice.messaging;

import com.pm.registrationservice.model.EventInventory;
import com.pm.registrationservice.model.EventStatus;
import com.pm.registrationservice.model.RegistrationTypeInventory;
import com.pm.registrationservice.repository.EventInventoryRepository;
import com.pm.registrationservice.repository.RegistrationTypeInventoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Component
public class EventInventoryConsumer {
    private static final Logger log = LoggerFactory.getLogger(EventInventoryConsumer.class);

    private final EventInventoryRepository inventoryRepository;
    private final RegistrationTypeInventoryRepository typeInventoryRepository;
    private final ObjectMapper objectMapper;

    public EventInventoryConsumer(EventInventoryRepository inventoryRepository,
                                  RegistrationTypeInventoryRepository typeInventoryRepository,
                                  ObjectMapper objectMapper) {
        this.inventoryRepository = inventoryRepository;
        this.typeInventoryRepository = typeInventoryRepository;
        this.objectMapper = objectMapper;
    }

    @RabbitListener(
            queues = "${qeue.rabbitmq.inventory-queue}",
            autoStartup = "${qeue.rabbitmq.listener-enabled:false}"
    )
    @Transactional
    public void consumeEventMessage(String payloadJson) {
        EventInventoryMessage message = readMessage(payloadJson);
        validateMessage(message);

        switch (message.eventType()) {
            case "EventPublished" -> upsertPublishedInventory(message);
            case "EventCancelled" -> cancelInventory(message);
            default -> throw new IllegalArgumentException("Unsupported event inventory message type " + message.eventType());
        }
    }

    private EventInventoryMessage readMessage(String payloadJson) {
        try {
            return objectMapper.readValue(payloadJson, EventInventoryMessage.class);
        } catch (JacksonException ex) {
            throw new IllegalArgumentException("Unable to read event inventory message", ex);
        }
    }

    private void validateMessage(EventInventoryMessage message) {
        if (message.eventId() == null) {
            throw new IllegalArgumentException("Event inventory message requires eventId");
        }
        if (message.title() == null || message.title().isBlank()) {
            throw new IllegalArgumentException("Event inventory message requires title");
        }
        if (message.organizerId() == null) {
            throw new IllegalArgumentException("Event inventory message requires organizerId");
        }
        if (message.startsAt() == null) {
            throw new IllegalArgumentException("Event inventory message requires startsAt");
        }
        if (message.capacity() == null || message.capacity() < 1) {
            throw new IllegalArgumentException("Event inventory message requires positive capacity");
        }
    }

    private void upsertPublishedInventory(EventInventoryMessage message) {
        EventInventory inventory = inventoryRepository.findById(message.eventId())
                .orElseGet(EventInventory::new);
        boolean newInventory = inventory.getEventId() == null;

        inventory.setEventId(message.eventId());
        inventory.setOrganizerId(message.organizerId());
        inventory.setTitle(message.title());
        inventory.setStartsAt(message.startsAt());
        inventory.setVenueName(message.venueName());
        inventory.setTimezone(message.timezone());
        inventory.setCapacity(message.capacity());
        inventory.setConfirmedCount(newInventory ? 0 : inventory.getConfirmedCount());
        inventory.setEventStatus(EventStatus.PUBLISHED);

        inventoryRepository.save(inventory);
        upsertRegistrationTypes(message);
        log.info("Projected event inventory action=event_published eventId={}", message.eventId());
    }

    private void cancelInventory(EventInventoryMessage message) {
        EventInventory inventory = inventoryRepository.findById(message.eventId())
                .orElseGet(EventInventory::new);
        boolean newInventory = inventory.getEventId() == null;

        inventory.setEventId(message.eventId());
        inventory.setOrganizerId(message.organizerId());
        inventory.setTitle(message.title());
        inventory.setStartsAt(message.startsAt());
        inventory.setVenueName(message.venueName());
        inventory.setTimezone(message.timezone());
        inventory.setCapacity(message.capacity());
        inventory.setConfirmedCount(newInventory ? 0 : inventory.getConfirmedCount());
        inventory.setEventStatus(EventStatus.CANCELLED);

        inventoryRepository.save(inventory);
        for (RegistrationTypeInventory typeInventory : typeInventoryRepository.findByEventId(message.eventId())) {
            typeInventory.setActive(false);
            typeInventoryRepository.save(typeInventory);
        }
        log.info("Projected event inventory action=event_cancelled eventId={}", message.eventId());
    }

    private void upsertRegistrationTypes(EventInventoryMessage message) {
        if (message.registrationTypes() == null) {
            return;
        }
        for (EventInventoryMessage.RegistrationTypeProjection projection : message.registrationTypes()) {
            if (projection.registrationTypeId() == null || projection.name() == null || projection.capacity() == null) {
                continue;
            }
            RegistrationTypeInventory inventory = typeInventoryRepository.findById(projection.registrationTypeId())
                    .orElseGet(RegistrationTypeInventory::new);
            boolean newInventory = inventory.getRegistrationTypeId() == null;
            inventory.setRegistrationTypeId(projection.registrationTypeId());
            inventory.setEventId(message.eventId());
            inventory.setName(projection.name());
            inventory.setCapacity(projection.capacity());
            inventory.setConfirmedCount(newInventory ? 0 : inventory.getConfirmedCount());
            inventory.setActive(Boolean.TRUE.equals(projection.active()));
            typeInventoryRepository.save(inventory);
        }
    }
}
