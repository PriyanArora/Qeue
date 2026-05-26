package com.pm.registrationservice.service;

import com.pm.registrationservice.dto.*;
import com.pm.registrationservice.exception.BadRequestException;
import com.pm.registrationservice.exception.ConflictException;
import com.pm.registrationservice.exception.ForbiddenException;
import com.pm.registrationservice.exception.NotFoundException;
import com.pm.registrationservice.model.*;
import com.pm.registrationservice.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RegistrationService {
    private final EventInventoryRepository inventoryRepository;
    private final RegistrationRepository registrationRepository;
    private final RegistrationAnswerRepository answerRepository;
    private final RegistrationTypeInventoryRepository typeInventoryRepository;
    private final SurveySubmissionRepository surveySubmissionRepository;
    private final SurveyAnswerRepository surveyAnswerRepository;
    private final RegistrationOutboxRepository outboxRepository;
    private final ObjectMapper objectMapper;

    public RegistrationService(EventInventoryRepository inventoryRepository,
                               RegistrationRepository registrationRepository,
                               RegistrationAnswerRepository answerRepository,
                               RegistrationTypeInventoryRepository typeInventoryRepository,
                               SurveySubmissionRepository surveySubmissionRepository,
                               SurveyAnswerRepository surveyAnswerRepository,
                               RegistrationOutboxRepository outboxRepository,
                               ObjectMapper objectMapper) {
        this.inventoryRepository = inventoryRepository;
        this.registrationRepository = registrationRepository;
        this.answerRepository = answerRepository;
        this.typeInventoryRepository = typeInventoryRepository;
        this.surveySubmissionRepository = surveySubmissionRepository;
        this.surveyAnswerRepository = surveyAnswerRepository;
        this.outboxRepository = outboxRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<RegistrationResponseDTO> listMyRegistrations(UUID attendeeId) {
        return registrationRepository.findByAttendeeIdOrderByCreatedAtDesc(attendeeId)
                .stream()
                .map(registration -> toResponse(registration, findInventory(registration.getEventId())))
                .toList();
    }

    @Transactional
    public RegistrationResponseDTO register(UUID eventId,
                                            UUID attendeeId,
                                            String attendeeEmail,
                                            RegistrationRequestDTO request) {
        validateAnswers(request.answers());
        var existing = registrationRepository.findByAttendeeIdAndIdempotencyKey(attendeeId, request.idempotencyKey());
        if (existing.isPresent()) {
            Registration registration = existing.get();
            return toResponse(registration, findInventory(registration.getEventId()));
        }

        EventInventory inventory = inventoryRepository.findByEventIdForUpdate(eventId)
                .orElseThrow(() -> new NotFoundException("Event inventory not found"));
        if (inventory.getEventStatus() != EventStatus.PUBLISHED) {
            throw new ConflictException("Event is not available for registration");
        }
        if (inventory.getConfirmedCount() >= inventory.getCapacity()) {
            throw new ConflictException("Event is sold out");
        }
        if (registrationRepository.existsByEventIdAndAttendeeIdAndStatus(eventId, attendeeId, RegistrationStatus.CONFIRMED)) {
            throw new ConflictException("Attendee is already registered for this event");
        }

        RegistrationTypeInventory typeInventory = resolveRegistrationType(eventId, request.registrationTypeId());
        Instant now = Instant.now();
        Registration registration = new Registration();
        registration.setEventId(eventId);
        registration.setAttendeeId(attendeeId);
        registration.setAttendeeEmail(attendeeEmail);
        registration.setAttendeeDisplayNameSnapshot(attendeeEmail);
        registration.setRegistrationTypeId(typeInventory == null ? null : typeInventory.getRegistrationTypeId());
        registration.setRegistrationTypeNameSnapshot(typeInventory == null ? null : typeInventory.getName());
        registration.setStatus(RegistrationStatus.CONFIRMED);
        registration.setCheckInStatus(CheckInStatus.NOT_CHECKED_IN);
        registration.setIdempotencyKey(request.idempotencyKey());
        registration.setActiveRegistrationKey(RegistrationStatus.CONFIRMED.name());
        registration.setCreatedAt(now);

        inventory.setConfirmedCount(inventory.getConfirmedCount() + 1);
        inventoryRepository.save(inventory);
        if (typeInventory != null) {
            typeInventory.setConfirmedCount(typeInventory.getConfirmedCount() + 1);
            typeInventoryRepository.save(typeInventory);
        }
        Registration saved = registrationRepository.save(registration);
        saveRegistrationAnswers(saved.getId(), request.answers(), now);
        createOutboxMessage(saved, inventory, "RegistrationConfirmed");
        return toResponse(saved, inventory);
    }

    @Transactional
    public RegistrationResponseDTO cancel(UUID registrationId, UUID attendeeId) {
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new NotFoundException("Registration not found"));
        if (!registration.getAttendeeId().equals(attendeeId)) {
            throw new ForbiddenException("Cannot cancel another attendee's registration");
        }
        EventInventory inventory = inventoryRepository.findByEventIdForUpdate(registration.getEventId())
                .orElseThrow(() -> new NotFoundException("Event inventory not found"));
        if (registration.getStatus() == RegistrationStatus.CANCELLED) {
            return toResponse(registration, inventory);
        }
        registration.setStatus(RegistrationStatus.CANCELLED);
        registration.setCancelledAt(Instant.now());
        registration.setActiveRegistrationKey(null);
        inventory.setConfirmedCount(Math.max(0, inventory.getConfirmedCount() - 1));
        inventoryRepository.save(inventory);
        if (registration.getRegistrationTypeId() != null) {
            typeInventoryRepository.findByRegistrationTypeIdForUpdate(registration.getRegistrationTypeId())
                    .ifPresent(type -> {
                        type.setConfirmedCount(Math.max(0, type.getConfirmedCount() - 1));
                        typeInventoryRepository.save(type);
                    });
        }
        Registration saved = registrationRepository.save(registration);
        createOutboxMessage(saved, inventory, "RegistrationCancelled");
        return toResponse(saved, inventory);
    }

    @Transactional(readOnly = true)
    public List<OrganizerRegistrationResponseDTO> listOrganizerRegistrations(UUID organizerId,
                                                                             UUID eventId,
                                                                             RegistrationStatus status,
                                                                             UUID registrationTypeId,
                                                                             String query) {
        EventInventory inventory = findOrganizerInventory(organizerId, eventId);
        String normalizedQuery = query == null ? "" : query.toLowerCase(Locale.ROOT);
        return registrationRepository.findByEventIdOrderByCreatedAtDesc(eventId)
                .stream()
                .filter(registration -> status == null || registration.getStatus() == status)
                .filter(registration -> registrationTypeId == null || registrationTypeId.equals(registration.getRegistrationTypeId()))
                .filter(registration -> normalizedQuery.isBlank()
                        || registration.getAttendeeEmail().toLowerCase(Locale.ROOT).contains(normalizedQuery)
                        || registration.getAttendeeDisplayNameSnapshot().toLowerCase(Locale.ROOT).contains(normalizedQuery))
                .map(registration -> toOrganizerResponse(registration, inventory))
                .toList();
    }

    @Transactional(readOnly = true)
    public OrganizerRegistrationResponseDTO getOrganizerRegistration(UUID organizerId, UUID eventId, UUID registrationId) {
        EventInventory inventory = findOrganizerInventory(organizerId, eventId);
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new NotFoundException("Registration not found"));
        if (!registration.getEventId().equals(eventId)) {
            throw new NotFoundException("Registration not found");
        }
        return toOrganizerResponse(registration, inventory);
    }

    @Transactional(readOnly = true)
    public String exportOrganizerRegistrations(UUID organizerId, UUID eventId) {
        EventInventory inventory = findOrganizerInventory(organizerId, eventId);
        List<Registration> registrations = registrationRepository.findByEventIdOrderByCreatedAtDesc(eventId);
        StringBuilder csv = new StringBuilder();
        csv.append("registrationId,eventId,attendeeEmail,attendeeDisplayName,registrationType,status,checkInStatus,registeredAt,cancelledAt,checkedInAt,answers\n");
        for (Registration registration : registrations) {
            csv.append(csv(registration.getId()));
            csv.append(',').append(csv(registration.getEventId()));
            csv.append(',').append(csv(registration.getAttendeeEmail()));
            csv.append(',').append(csv(registration.getAttendeeDisplayNameSnapshot()));
            csv.append(',').append(csv(registration.getRegistrationTypeNameSnapshot()));
            csv.append(',').append(csv(registration.getStatus()));
            csv.append(',').append(csv(registration.getCheckInStatus()));
            csv.append(',').append(csv(registration.getCreatedAt()));
            csv.append(',').append(csv(registration.getCancelledAt()));
            csv.append(',').append(csv(registration.getCheckedInAt()));
            csv.append(',').append(csv(answerSummary(registration.getId())));
            csv.append('\n');
        }
        return csv.toString();
    }

    @Transactional
    public TicketResponseDTO issueTicket(UUID registrationId, UUID attendeeId) {
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new NotFoundException("Registration not found"));
        if (!registration.getAttendeeId().equals(attendeeId)) {
            throw new ForbiddenException("Cannot view another attendee's ticket");
        }
        if (registration.getStatus() != RegistrationStatus.CONFIRMED) {
            throw new ConflictException("Only confirmed registrations have tickets");
        }
        String code = newTicketCode();
        Instant now = Instant.now();
        registration.setTicketCodeHash(hashTicketCode(code));
        registration.setTicketCodeIssuedAt(now);
        registrationRepository.save(registration);
        return new TicketResponseDTO(registration.getId(), registration.getEventId(), code, now);
    }

    @Transactional
    public CheckInResponseDTO checkIn(UUID organizerId, UUID eventId, CheckInRequestDTO request) {
        findOrganizerInventory(organizerId, eventId);
        Registration registration = registrationRepository.findByEventIdAndTicketCodeHash(eventId, hashTicketCode(request.ticketCode()))
                .orElseThrow(() -> new NotFoundException("Registration not found for ticket code"));
        if (registration.getStatus() != RegistrationStatus.CONFIRMED) {
            throw new ConflictException("Cancelled registrations cannot be checked in");
        }
        if (registration.getCheckInStatus() != CheckInStatus.CHECKED_IN) {
            registration.setCheckInStatus(CheckInStatus.CHECKED_IN);
            registration.setCheckedInAt(Instant.now());
            registration.setCheckedInByOrganizerId(organizerId);
            registration = registrationRepository.save(registration);
            createOutboxMessage(registration, findInventory(eventId), "CheckInCompleted");
        }
        return new CheckInResponseDTO(
                registration.getCheckInStatus(),
                registration.getId(),
                registration.getAttendeeEmail(),
                registration.getCheckedInAt()
        );
    }

    @Transactional(readOnly = true)
    public EventAnalyticsResponseDTO analytics(UUID organizerId, UUID eventId) {
        EventInventory inventory = findOrganizerInventory(organizerId, eventId);
        List<Registration> registrations = registrationRepository.findByEventIdOrderByCreatedAtDesc(eventId);
        long confirmed = registrations.stream().filter(registration -> registration.getStatus() == RegistrationStatus.CONFIRMED).count();
        long cancelled = registrations.stream().filter(registration -> registration.getStatus() == RegistrationStatus.CANCELLED).count();
        long checkIns = registrations.stream().filter(registration -> registration.getCheckInStatus() == CheckInStatus.CHECKED_IN).count();
        Map<String, Long> byType = registrations.stream()
                .filter(registration -> registration.getStatus() == RegistrationStatus.CONFIRMED)
                .filter(registration -> registration.getRegistrationTypeNameSnapshot() != null)
                .collect(Collectors.groupingBy(Registration::getRegistrationTypeNameSnapshot, LinkedHashMap::new, Collectors.counting()));
        return new EventAnalyticsResponseDTO(
                inventory.getCapacity(),
                confirmed,
                cancelled,
                Math.max(0, inventory.getCapacity() - confirmed),
                checkIns,
                Math.max(0, confirmed - checkIns),
                byType.entrySet().stream().map(entry -> new RegistrationTypeBreakdownDTO(entry.getKey(), entry.getValue())).toList()
        );
    }

    @Transactional
    public SurveySubmissionResponseDTO submitSurvey(UUID eventId,
                                                    UUID surveyId,
                                                    UUID attendeeId,
                                                    SurveySubmissionRequestDTO request) {
        registrationRepository.findFirstByEventIdAndAttendeeIdAndStatus(eventId, attendeeId, RegistrationStatus.CONFIRMED)
                .orElseThrow(() -> new ForbiddenException("Only confirmed attendees can submit this survey"));
        if (surveySubmissionRepository.existsBySurveyIdAndAttendeeId(surveyId, attendeeId)) {
            throw new ConflictException("Survey already submitted");
        }
        validateSurveyAnswers(request.answers());
        SurveySubmission submission = new SurveySubmission();
        submission.setSurveyId(surveyId);
        submission.setEventId(eventId);
        submission.setAttendeeId(attendeeId);
        submission.setSubmittedAt(Instant.now());
        SurveySubmission saved = surveySubmissionRepository.save(submission);
        saveSurveyAnswers(saved.getId(), request.answers());
        return toSurveySubmissionResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<SurveySubmissionResponseDTO> listSurveyResponses(UUID organizerId, UUID eventId, UUID surveyId) {
        findOrganizerInventory(organizerId, eventId);
        return surveySubmissionRepository.findByEventIdAndSurveyIdOrderBySubmittedAtDesc(eventId, surveyId)
                .stream()
                .map(this::toSurveySubmissionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RegistrationOutboxMessage> listPendingOutboxMessages() {
        return outboxRepository.findByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING);
    }

    private RegistrationTypeInventory resolveRegistrationType(UUID eventId, UUID registrationTypeId) {
        if (registrationTypeId == null) {
            if (typeInventoryRepository.existsByEventIdAndActiveTrue(eventId)) {
                throw new BadRequestException("Registration type is required");
            }
            return null;
        }
        RegistrationTypeInventory typeInventory = typeInventoryRepository.findByRegistrationTypeIdForUpdate(registrationTypeId)
                .orElseThrow(() -> new NotFoundException("Registration type inventory not found"));
        if (!typeInventory.getEventId().equals(eventId) || !typeInventory.isActive()) {
            throw new ConflictException("Registration type is not available");
        }
        if (typeInventory.getConfirmedCount() >= typeInventory.getCapacity()) {
            throw new ConflictException("Registration type is sold out");
        }
        return typeInventory;
    }

    private EventInventory findInventory(UUID eventId) {
        return inventoryRepository.findById(eventId)
                .orElseThrow(() -> new NotFoundException("Event inventory not found"));
    }

    private EventInventory findOrganizerInventory(UUID organizerId, UUID eventId) {
        EventInventory inventory = findInventory(eventId);
        if (inventory.getOrganizerId() == null || !inventory.getOrganizerId().equals(organizerId)) {
            throw new ForbiddenException("Organizer does not own this event");
        }
        return inventory;
    }

    private void validateAnswers(List<RegistrationAnswerDTO> answers) {
        if (answers == null) {
            return;
        }
        Set<UUID> questionIds = new HashSet<>();
        for (RegistrationAnswerDTO answer : answers) {
            if (answer.questionId() == null) {
                throw new BadRequestException("Question id is required");
            }
            if (!questionIds.add(answer.questionId())) {
                throw new BadRequestException("Duplicate answer question id");
            }
        }
    }

    private void validateSurveyAnswers(List<SurveyAnswerDTO> answers) {
        if (answers == null) {
            return;
        }
        Set<UUID> questionIds = new HashSet<>();
        for (SurveyAnswerDTO answer : answers) {
            if (answer.questionId() == null) {
                throw new BadRequestException("Question id is required");
            }
            if (!questionIds.add(answer.questionId())) {
                throw new BadRequestException("Duplicate survey question id");
            }
        }
    }

    private void saveRegistrationAnswers(UUID registrationId, List<RegistrationAnswerDTO> answers, Instant createdAt) {
        if (answers == null) {
            return;
        }
        for (RegistrationAnswerDTO answer : answers) {
            RegistrationAnswer entity = new RegistrationAnswer();
            entity.setRegistrationId(registrationId);
            entity.setQuestionId(answer.questionId());
            entity.setAnswerText(answer.answerText() == null ? "" : answer.answerText());
            entity.setCreatedAt(createdAt);
            answerRepository.save(entity);
        }
    }

    private void saveSurveyAnswers(UUID submissionId, List<SurveyAnswerDTO> answers) {
        if (answers == null) {
            return;
        }
        for (SurveyAnswerDTO answer : answers) {
            SurveyAnswer entity = new SurveyAnswer();
            entity.setSubmissionId(submissionId);
            entity.setQuestionId(answer.questionId());
            entity.setAnswerText(answer.answerText());
            entity.setRatingValue(answer.ratingValue());
            surveyAnswerRepository.save(entity);
        }
    }

    private RegistrationResponseDTO toResponse(Registration registration, EventInventory inventory) {
        return new RegistrationResponseDTO(
                registration.getId(),
                registration.getEventId(),
                inventory.getTitle(),
                inventory.getStartsAt(),
                registration.getAttendeeId(),
                registration.getAttendeeEmail(),
                registration.getAttendeeDisplayNameSnapshot(),
                registration.getRegistrationTypeId(),
                registration.getRegistrationTypeNameSnapshot(),
                registration.getStatus(),
                registration.getCheckInStatus(),
                registration.getCreatedAt(),
                registration.getCancelledAt(),
                registration.getCheckedInAt(),
                answerRepository.findByRegistrationId(registration.getId()).stream().map(this::toAnswerDTO).toList()
        );
    }

    private OrganizerRegistrationResponseDTO toOrganizerResponse(Registration registration, EventInventory inventory) {
        return new OrganizerRegistrationResponseDTO(
                registration.getId(),
                registration.getEventId(),
                inventory.getTitle(),
                inventory.getStartsAt(),
                registration.getAttendeeId(),
                registration.getAttendeeEmail(),
                registration.getAttendeeDisplayNameSnapshot(),
                registration.getRegistrationTypeId(),
                registration.getRegistrationTypeNameSnapshot(),
                registration.getStatus(),
                registration.getCheckInStatus(),
                registration.getCreatedAt(),
                registration.getCancelledAt(),
                registration.getCheckedInAt(),
                answerRepository.findByRegistrationId(registration.getId()).stream().map(this::toAnswerDTO).toList()
        );
    }

    private RegistrationAnswerDTO toAnswerDTO(RegistrationAnswer answer) {
        return new RegistrationAnswerDTO(answer.getQuestionId(), answer.getAnswerText());
    }

    private SurveySubmissionResponseDTO toSurveySubmissionResponse(SurveySubmission submission) {
        return new SurveySubmissionResponseDTO(
                submission.getId(),
                submission.getSurveyId(),
                submission.getEventId(),
                submission.getAttendeeId(),
                submission.getSubmittedAt(),
                surveyAnswerRepository.findBySubmissionId(submission.getId()).stream().map(this::toSurveyAnswerDTO).toList()
        );
    }

    private SurveyAnswerDTO toSurveyAnswerDTO(SurveyAnswer answer) {
        return new SurveyAnswerDTO(answer.getQuestionId(), answer.getAnswerText(), answer.getRatingValue());
    }

    private String answerSummary(UUID registrationId) {
        return answerRepository.findByRegistrationId(registrationId)
                .stream()
                .map(answer -> answer.getQuestionId() + "=" + answer.getAnswerText())
                .collect(Collectors.joining("; "));
    }

    private void createOutboxMessage(Registration registration, EventInventory inventory, String eventType) {
        RegistrationOutboxMessage message = new RegistrationOutboxMessage();
        message.setAggregateId(registration.getId());
        message.setEventType(eventType);
        message.setPayloadJson(toPayloadJson(registration, inventory, eventType));
        message.setStatus(OutboxStatus.PENDING);
        message.setCreatedAt(Instant.now());
        outboxRepository.save(message);
    }

    private String toPayloadJson(Registration registration, EventInventory inventory, String eventType) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("eventType", eventType);
        payload.put("registrationId", registration.getId());
        payload.put("eventId", registration.getEventId());
        payload.put("eventTitle", inventory.getTitle());
        payload.put("startsAt", inventory.getStartsAt());
        payload.put("venueName", inventory.getVenueName());
        payload.put("attendeeId", registration.getAttendeeId());
        payload.put("attendeeEmail", registration.getAttendeeEmail());
        payload.put("registrationTypeName", registration.getRegistrationTypeNameSnapshot());
        payload.put("status", registration.getStatus().name());
        payload.put("createdAt", registration.getCreatedAt());
        if (registration.getCancelledAt() != null) {
            payload.put("cancelledAt", registration.getCancelledAt());
        }
        if (registration.getCheckedInAt() != null) {
            payload.put("checkedInAt", registration.getCheckedInAt());
        }
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JacksonException ex) {
            throw new IllegalStateException("Unable to serialize registration outbox payload", ex);
        }
    }

    private String newTicketCode() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
    }

    private String hashTicketCode(String ticketCode) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(digest.digest(ticketCode.trim().toUpperCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to hash ticket code", ex);
        }
    }

    private String csv(Object value) {
        String text = value == null ? "" : value.toString();
        return "\"" + text.replace("\"", "\"\"").replace("\r", " ").replace("\n", " ") + "\"";
    }
}
