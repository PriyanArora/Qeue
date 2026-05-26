package com.pm.eventservice.service;

import com.pm.eventservice.dto.*;
import com.pm.eventservice.exception.BadRequestException;
import com.pm.eventservice.exception.ConflictException;
import com.pm.eventservice.exception.EventNotFoundException;
import com.pm.eventservice.exception.ForbiddenException;
import com.pm.eventservice.mapper.EventMapper;
import com.pm.eventservice.model.*;
import com.pm.eventservice.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.time.ZoneId;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class EventService {
    private final EventRepository eventRepository;
    private final EventOutboxRepository outboxRepository;
    private final RegistrationQuestionRepository questionRepository;
    private final RegistrationTypeRepository typeRepository;
    private final SpeakerRepository speakerRepository;
    private final EventSessionRepository sessionRepository;
    private final SessionSpeakerRepository sessionSpeakerRepository;
    private final SurveyRepository surveyRepository;
    private final SurveyQuestionRepository surveyQuestionRepository;
    private final ObjectMapper objectMapper;

    public EventService(EventRepository eventRepository,
                        EventOutboxRepository outboxRepository,
                        RegistrationQuestionRepository questionRepository,
                        RegistrationTypeRepository typeRepository,
                        SpeakerRepository speakerRepository,
                        EventSessionRepository sessionRepository,
                        SessionSpeakerRepository sessionSpeakerRepository,
                        SurveyRepository surveyRepository,
                        SurveyQuestionRepository surveyQuestionRepository,
                        ObjectMapper objectMapper) {
        this.eventRepository = eventRepository;
        this.outboxRepository = outboxRepository;
        this.questionRepository = questionRepository;
        this.typeRepository = typeRepository;
        this.speakerRepository = speakerRepository;
        this.sessionRepository = sessionRepository;
        this.sessionSpeakerRepository = sessionSpeakerRepository;
        this.surveyRepository = surveyRepository;
        this.surveyQuestionRepository = surveyQuestionRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<EventSummaryResponseDTO> listPublishedEvents() {
        return eventRepository.findByStatusOrderByStartsAtAsc(EventStatus.PUBLISHED)
                .stream()
                .map(EventMapper::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public EventDetailResponseDTO getPublishedEvent(UUID eventId) {
        Event event = findEvent(eventId);
        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new EventNotFoundException("Published event not found with id " + eventId);
        }
        return EventMapper.toDetail(event);
    }

    @Transactional(readOnly = true)
    public List<EventSummaryResponseDTO> listOrganizerEvents(UUID organizerId) {
        return eventRepository.findByOrganizerIdOrderByStartsAtAsc(organizerId)
                .stream()
                .map(EventMapper::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public EventDetailResponseDTO getOrganizerEvent(UUID organizerId, UUID eventId) {
        return EventMapper.toDetail(findOwnedEvent(organizerId, eventId));
    }

    @Transactional
    public EventDetailResponseDTO createDraft(UUID organizerId, EventCreateRequestDTO request) {
        validateEventRequest(request.startsAt(), request.endsAt(), request.timezone());
        Instant now = Instant.now();
        Event event = new Event();
        event.setOrganizerId(organizerId);
        applyEventRequest(event, request.title(), request.description(), request.eventFormat(), request.category(),
                request.bannerImageUrl(), request.venueName(), request.venueCity(), request.venueAddress(),
                request.timezone(), request.startsAt(), request.endsAt(), request.capacity());
        event.setStatus(EventStatus.DRAFT);
        event.setCreatedAt(now);
        event.setUpdatedAt(now);
        return EventMapper.toDetail(eventRepository.save(event));
    }

    @Transactional
    public EventDetailResponseDTO updateDraft(UUID organizerId, UUID eventId, EventUpdateRequestDTO request) {
        validateEventRequest(request.startsAt(), request.endsAt(), request.timezone());
        Event event = findOwnedEvent(organizerId, eventId);
        if (event.getStatus() != EventStatus.DRAFT) {
            throw new ConflictException("Only draft events can be updated");
        }
        applyEventRequest(event, request.title(), request.description(), request.eventFormat(), request.category(),
                request.bannerImageUrl(), request.venueName(), request.venueCity(), request.venueAddress(),
                request.timezone(), request.startsAt(), request.endsAt(), request.capacity());
        event.setUpdatedAt(Instant.now());
        return EventMapper.toDetail(eventRepository.save(event));
    }

    @Transactional
    public EventDetailResponseDTO publish(UUID organizerId, UUID eventId) {
        Event event = findOwnedEvent(organizerId, eventId);
        if (event.getStatus() != EventStatus.DRAFT) {
            throw new ConflictException("Only draft events can be published");
        }
        validateEventRequest(event.getStartsAt(), event.getEndsAt(), event.getTimezone());
        if (event.getCapacity() == null || event.getCapacity() < 1) {
            throw new ConflictException("Event capacity must be at least 1 before publishing");
        }
        event.setStatus(EventStatus.PUBLISHED);
        event.setUpdatedAt(Instant.now());
        Event saved = eventRepository.save(event);
        createOutboxMessage(saved, "EventPublished");
        return EventMapper.toDetail(saved);
    }

    @Transactional
    public EventDetailResponseDTO cancel(UUID organizerId, UUID eventId) {
        Event event = findOwnedEvent(organizerId, eventId);
        if (event.getStatus() == EventStatus.CANCELLED) {
            return EventMapper.toDetail(event);
        }
        event.setStatus(EventStatus.CANCELLED);
        event.setUpdatedAt(Instant.now());
        Event saved = eventRepository.save(event);
        createOutboxMessage(saved, "EventCancelled");
        return EventMapper.toDetail(saved);
    }

    @Transactional(readOnly = true)
    public List<RegistrationQuestionResponseDTO> listOrganizerQuestions(UUID organizerId, UUID eventId) {
        findOwnedEvent(organizerId, eventId);
        return questionRepository.findByEventIdOrderBySortOrderAsc(eventId).stream().map(this::toQuestionResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RegistrationQuestionResponseDTO> listPublicQuestions(UUID eventId) {
        requirePublishedEvent(eventId);
        return questionRepository.findByEventIdAndActiveTrueOrderBySortOrderAsc(eventId).stream().map(this::toQuestionResponse).toList();
    }

    @Transactional
    public RegistrationQuestionResponseDTO createQuestion(UUID organizerId, UUID eventId, RegistrationQuestionRequestDTO request) {
        findOwnedEvent(organizerId, eventId);
        Instant now = Instant.now();
        RegistrationQuestion question = new RegistrationQuestion();
        question.setEventId(eventId);
        applyQuestionRequest(question, request);
        question.setCreatedAt(now);
        question.setUpdatedAt(now);
        return toQuestionResponse(questionRepository.save(question));
    }

    @Transactional
    public RegistrationQuestionResponseDTO updateQuestion(UUID organizerId, UUID eventId, UUID questionId, RegistrationQuestionRequestDTO request) {
        findOwnedEvent(organizerId, eventId);
        RegistrationQuestion question = findQuestion(eventId, questionId);
        applyQuestionRequest(question, request);
        question.setUpdatedAt(Instant.now());
        return toQuestionResponse(questionRepository.save(question));
    }

    @Transactional
    public void deactivateQuestion(UUID organizerId, UUID eventId, UUID questionId) {
        findOwnedEvent(organizerId, eventId);
        RegistrationQuestion question = findQuestion(eventId, questionId);
        question.setActive(false);
        question.setUpdatedAt(Instant.now());
        questionRepository.save(question);
    }

    @Transactional(readOnly = true)
    public List<RegistrationTypeResponseDTO> listOrganizerTypes(UUID organizerId, UUID eventId) {
        findOwnedEvent(organizerId, eventId);
        return typeRepository.findByEventIdOrderBySortOrderAsc(eventId).stream().map(this::toTypeResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RegistrationTypeResponseDTO> listPublicTypes(UUID eventId) {
        requirePublishedEvent(eventId);
        return typeRepository.findByEventIdAndActiveTrueOrderBySortOrderAsc(eventId).stream().map(this::toTypeResponse).toList();
    }

    @Transactional
    public RegistrationTypeResponseDTO createType(UUID organizerId, UUID eventId, RegistrationTypeRequestDTO request) {
        findEditableOwnedEvent(organizerId, eventId);
        Instant now = Instant.now();
        RegistrationType type = new RegistrationType();
        type.setEventId(eventId);
        applyTypeRequest(type, request);
        type.setCreatedAt(now);
        type.setUpdatedAt(now);
        return toTypeResponse(typeRepository.save(type));
    }

    @Transactional
    public RegistrationTypeResponseDTO updateType(UUID organizerId, UUID eventId, UUID typeId, RegistrationTypeRequestDTO request) {
        findEditableOwnedEvent(organizerId, eventId);
        RegistrationType type = findType(eventId, typeId);
        applyTypeRequest(type, request);
        type.setUpdatedAt(Instant.now());
        return toTypeResponse(typeRepository.save(type));
    }

    @Transactional
    public void deactivateType(UUID organizerId, UUID eventId, UUID typeId) {
        findEditableOwnedEvent(organizerId, eventId);
        RegistrationType type = findType(eventId, typeId);
        type.setActive(false);
        type.setUpdatedAt(Instant.now());
        typeRepository.save(type);
    }

    @Transactional(readOnly = true)
    public List<SpeakerResponseDTO> listOrganizerSpeakers(UUID organizerId, UUID eventId) {
        findOwnedEvent(organizerId, eventId);
        return speakerRepository.findByEventIdOrderByNameAsc(eventId).stream().map(this::toSpeakerResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<SpeakerResponseDTO> listPublicSpeakers(UUID eventId) {
        requirePublishedEvent(eventId);
        return speakerRepository.findByEventIdOrderByNameAsc(eventId).stream().map(this::toSpeakerResponse).toList();
    }

    @Transactional
    public SpeakerResponseDTO createSpeaker(UUID organizerId, UUID eventId, SpeakerRequestDTO request) {
        findOwnedEvent(organizerId, eventId);
        Instant now = Instant.now();
        Speaker speaker = new Speaker();
        speaker.setEventId(eventId);
        applySpeakerRequest(speaker, request);
        speaker.setCreatedAt(now);
        speaker.setUpdatedAt(now);
        return toSpeakerResponse(speakerRepository.save(speaker));
    }

    @Transactional
    public SpeakerResponseDTO updateSpeaker(UUID organizerId, UUID eventId, UUID speakerId, SpeakerRequestDTO request) {
        findOwnedEvent(organizerId, eventId);
        Speaker speaker = findSpeaker(eventId, speakerId);
        applySpeakerRequest(speaker, request);
        speaker.setUpdatedAt(Instant.now());
        return toSpeakerResponse(speakerRepository.save(speaker));
    }

    @Transactional
    public void deleteSpeaker(UUID organizerId, UUID eventId, UUID speakerId) {
        findOwnedEvent(organizerId, eventId);
        Speaker speaker = findSpeaker(eventId, speakerId);
        speakerRepository.delete(speaker);
    }

    @Transactional(readOnly = true)
    public List<SessionResponseDTO> listOrganizerSessions(UUID organizerId, UUID eventId) {
        findOwnedEvent(organizerId, eventId);
        return toSessionResponses(sessionRepository.findByEventIdOrderByStartsAtAsc(eventId));
    }

    @Transactional(readOnly = true)
    public List<SessionResponseDTO> listPublicSessions(UUID eventId) {
        requirePublishedEvent(eventId);
        return toSessionResponses(sessionRepository.findByEventIdAndStatusOrderByStartsAtAsc(eventId, SessionStatus.PUBLISHED));
    }

    @Transactional
    public SessionResponseDTO createSession(UUID organizerId, UUID eventId, SessionRequestDTO request) {
        Event event = findOwnedEvent(organizerId, eventId);
        validateSessionRequest(event, request);
        Instant now = Instant.now();
        EventSession session = new EventSession();
        session.setEventId(eventId);
        applySessionRequest(session, request);
        session.setCreatedAt(now);
        session.setUpdatedAt(now);
        EventSession saved = sessionRepository.save(session);
        replaceSessionSpeakers(eventId, saved.getId(), request.speakerIds());
        return toSessionResponse(saved);
    }

    @Transactional
    public SessionResponseDTO updateSession(UUID organizerId, UUID eventId, UUID sessionId, SessionRequestDTO request) {
        Event event = findOwnedEvent(organizerId, eventId);
        validateSessionRequest(event, request);
        EventSession session = findSession(eventId, sessionId);
        applySessionRequest(session, request);
        session.setUpdatedAt(Instant.now());
        EventSession saved = sessionRepository.save(session);
        replaceSessionSpeakers(eventId, saved.getId(), request.speakerIds());
        return toSessionResponse(saved);
    }

    @Transactional
    public void deleteSession(UUID organizerId, UUID eventId, UUID sessionId) {
        findOwnedEvent(organizerId, eventId);
        EventSession session = findSession(eventId, sessionId);
        sessionSpeakerRepository.deleteBySessionId(session.getId());
        sessionRepository.delete(session);
    }

    @Transactional(readOnly = true)
    public List<SurveyResponseDTO> listOrganizerSurveys(UUID organizerId, UUID eventId) {
        findOwnedEvent(organizerId, eventId);
        return surveyRepository.findByEventIdOrderByCreatedAtDesc(eventId).stream().map(this::toSurveyResponse).toList();
    }

    @Transactional(readOnly = true)
    public SurveyResponseDTO getActiveSurvey(UUID eventId) {
        requirePublishedEvent(eventId);
        return surveyRepository.findFirstByEventIdAndStatusOrderByCreatedAtDesc(eventId, SurveyStatus.ACTIVE)
                .map(this::toSurveyResponse)
                .orElseThrow(() -> new EventNotFoundException("Active survey not found"));
    }

    @Transactional
    public SurveyResponseDTO createSurvey(UUID organizerId, UUID eventId, SurveyRequestDTO request) {
        findOwnedEvent(organizerId, eventId);
        Instant now = Instant.now();
        Survey survey = new Survey();
        survey.setEventId(eventId);
        survey.setTitle(request.title());
        survey.setStatus(request.status());
        survey.setCreatedAt(now);
        survey.setUpdatedAt(now);
        Survey saved = surveyRepository.save(survey);
        replaceSurveyQuestions(saved.getId(), request.questions());
        return toSurveyResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<EventOutboxMessage> listPendingOutboxMessages() {
        return outboxRepository.findByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING);
    }

    private Event findEvent(UUID eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException("Event not found with id " + eventId));
    }

    private Event findOwnedEvent(UUID organizerId, UUID eventId) {
        Event event = findEvent(eventId);
        if (!event.getOrganizerId().equals(organizerId)) {
            throw new ForbiddenException("Organizer does not own this event");
        }
        return event;
    }

    private Event findEditableOwnedEvent(UUID organizerId, UUID eventId) {
        Event event = findOwnedEvent(organizerId, eventId);
        if (event.getStatus() != EventStatus.DRAFT) {
            throw new ConflictException("This event setup can only be changed while the event is a draft");
        }
        return event;
    }

    private Event requirePublishedEvent(UUID eventId) {
        Event event = findEvent(eventId);
        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new EventNotFoundException("Published event not found with id " + eventId);
        }
        return event;
    }

    private RegistrationQuestion findQuestion(UUID eventId, UUID questionId) {
        RegistrationQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new EventNotFoundException("Registration question not found"));
        if (!question.getEventId().equals(eventId)) {
            throw new EventNotFoundException("Registration question not found");
        }
        return question;
    }

    private RegistrationType findType(UUID eventId, UUID typeId) {
        RegistrationType type = typeRepository.findById(typeId)
                .orElseThrow(() -> new EventNotFoundException("Registration type not found"));
        if (!type.getEventId().equals(eventId)) {
            throw new EventNotFoundException("Registration type not found");
        }
        return type;
    }

    private Speaker findSpeaker(UUID eventId, UUID speakerId) {
        Speaker speaker = speakerRepository.findById(speakerId)
                .orElseThrow(() -> new EventNotFoundException("Speaker not found"));
        if (!speaker.getEventId().equals(eventId)) {
            throw new EventNotFoundException("Speaker not found");
        }
        return speaker;
    }

    private EventSession findSession(UUID eventId, UUID sessionId) {
        EventSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new EventNotFoundException("Session not found"));
        if (!session.getEventId().equals(eventId)) {
            throw new EventNotFoundException("Session not found");
        }
        return session;
    }

    private void applyEventRequest(Event event,
                                   String title,
                                   String description,
                                   EventFormat eventFormat,
                                   String category,
                                   String bannerImageUrl,
                                   String venueName,
                                   String venueCity,
                                   String venueAddress,
                                   String timezone,
                                   Instant startsAt,
                                   Instant endsAt,
                                   Integer capacity) {
        event.setTitle(title);
        event.setDescription(description);
        event.setEventFormat(eventFormat);
        event.setCategory(category);
        event.setBannerImageUrl(blankToNull(bannerImageUrl));
        event.setVenueName(venueName);
        event.setVenueCity(venueCity);
        event.setVenueAddress(venueAddress);
        event.setTimezone(timezone);
        event.setStartsAt(startsAt);
        event.setEndsAt(endsAt);
        event.setCapacity(capacity);
    }

    private void validateEventRequest(Instant startsAt, Instant endsAt, String timezone) {
        if (startsAt == null || endsAt == null) {
            throw new BadRequestException("Start and end times are required");
        }
        if (!endsAt.isAfter(startsAt)) {
            throw new BadRequestException("End time must be after start time");
        }
        try {
            ZoneId.of(timezone);
        } catch (RuntimeException ex) {
            throw new BadRequestException("Timezone is invalid");
        }
    }

    private void applyQuestionRequest(RegistrationQuestion question, RegistrationQuestionRequestDTO request) {
        question.setQuestionText(request.questionText());
        question.setQuestionType(request.questionType());
        question.setRequired(request.required());
        question.setSortOrder(request.sortOrder());
        question.setActive(request.active());
    }

    private void applyTypeRequest(RegistrationType type, RegistrationTypeRequestDTO request) {
        type.setName(request.name());
        type.setDescription(request.description());
        type.setCapacity(request.capacity());
        type.setActive(request.active());
        type.setSortOrder(request.sortOrder());
    }

    private void applySpeakerRequest(Speaker speaker, SpeakerRequestDTO request) {
        speaker.setName(request.name());
        speaker.setTitle(request.title());
        speaker.setOrganization(request.organization());
        speaker.setBio(request.bio());
        speaker.setPhotoUrl(blankToNull(request.photoUrl()));
    }

    private void applySessionRequest(EventSession session, SessionRequestDTO request) {
        session.setTitle(request.title());
        session.setDescription(request.description());
        session.setStartsAt(request.startsAt());
        session.setEndsAt(request.endsAt());
        session.setRoomName(request.roomName());
        session.setCapacity(request.capacity());
        session.setStatus(request.status());
    }

    private void validateSessionRequest(Event event, SessionRequestDTO request) {
        if (request.endsAt() == null || request.startsAt() == null || !request.endsAt().isAfter(request.startsAt())) {
            throw new BadRequestException("Session end time must be after start time");
        }
        if (request.startsAt().isBefore(event.getStartsAt()) || request.endsAt().isAfter(event.getEndsAt())) {
            throw new BadRequestException("Session must be inside event time range");
        }
    }

    private void replaceSessionSpeakers(UUID eventId, UUID sessionId, List<UUID> speakerIds) {
        sessionSpeakerRepository.deleteBySessionId(sessionId);
        if (speakerIds == null || speakerIds.isEmpty()) {
            return;
        }
        List<Speaker> speakers = speakerRepository.findByIdIn(new LinkedHashSet<>(speakerIds));
        Set<UUID> found = speakers.stream()
                .filter(speaker -> speaker.getEventId().equals(eventId))
                .map(Speaker::getId)
                .collect(Collectors.toSet());
        if (!found.containsAll(new LinkedHashSet<>(speakerIds))) {
            throw new BadRequestException("Every session speaker must belong to the event");
        }
        for (UUID speakerId : new LinkedHashSet<>(speakerIds)) {
            SessionSpeaker link = new SessionSpeaker();
            link.setSessionId(sessionId);
            link.setSpeakerId(speakerId);
            sessionSpeakerRepository.save(link);
        }
    }

    private void replaceSurveyQuestions(UUID surveyId, List<SurveyQuestionRequestDTO> requests) {
        surveyQuestionRepository.deleteBySurveyId(surveyId);
        if (requests == null) {
            return;
        }
        for (SurveyQuestionRequestDTO request : requests) {
            SurveyQuestion question = new SurveyQuestion();
            question.setSurveyId(surveyId);
            question.setQuestionText(request.questionText());
            question.setQuestionType(request.questionType());
            question.setRequired(request.required());
            question.setSortOrder(request.sortOrder());
            surveyQuestionRepository.save(question);
        }
    }

    private RegistrationQuestionResponseDTO toQuestionResponse(RegistrationQuestion question) {
        return new RegistrationQuestionResponseDTO(
                question.getId(),
                question.getEventId(),
                question.getQuestionText(),
                question.getQuestionType(),
                question.isRequired(),
                question.getSortOrder(),
                question.isActive()
        );
    }

    private RegistrationTypeResponseDTO toTypeResponse(RegistrationType type) {
        return new RegistrationTypeResponseDTO(
                type.getId(),
                type.getEventId(),
                type.getName(),
                type.getDescription(),
                type.getCapacity(),
                type.isActive(),
                type.getSortOrder()
        );
    }

    private SpeakerResponseDTO toSpeakerResponse(Speaker speaker) {
        return new SpeakerResponseDTO(
                speaker.getId(),
                speaker.getEventId(),
                speaker.getName(),
                speaker.getTitle(),
                speaker.getOrganization(),
                speaker.getBio(),
                speaker.getPhotoUrl()
        );
    }

    private List<SessionResponseDTO> toSessionResponses(List<EventSession> sessions) {
        return sessions.stream().map(this::toSessionResponse).toList();
    }

    private SessionResponseDTO toSessionResponse(EventSession session) {
        List<SessionSpeaker> links = sessionSpeakerRepository.findBySessionId(session.getId());
        Map<UUID, Speaker> speakers = speakerRepository.findByIdIn(links.stream().map(SessionSpeaker::getSpeakerId).toList())
                .stream()
                .collect(Collectors.toMap(Speaker::getId, Function.identity()));
        List<SpeakerResponseDTO> speakerResponses = links.stream()
                .map(link -> speakers.get(link.getSpeakerId()))
                .filter(Objects::nonNull)
                .map(this::toSpeakerResponse)
                .toList();
        return new SessionResponseDTO(
                session.getId(),
                session.getEventId(),
                session.getTitle(),
                session.getDescription(),
                session.getStartsAt(),
                session.getEndsAt(),
                session.getRoomName(),
                session.getCapacity(),
                session.getStatus(),
                speakerResponses
        );
    }

    private SurveyResponseDTO toSurveyResponse(Survey survey) {
        return new SurveyResponseDTO(
                survey.getId(),
                survey.getEventId(),
                survey.getTitle(),
                survey.getStatus(),
                surveyQuestionRepository.findBySurveyIdOrderBySortOrderAsc(survey.getId()).stream()
                        .map(this::toSurveyQuestionResponse)
                        .toList()
        );
    }

    private SurveyQuestionResponseDTO toSurveyQuestionResponse(SurveyQuestion question) {
        return new SurveyQuestionResponseDTO(
                question.getId(),
                question.getSurveyId(),
                question.getQuestionText(),
                question.getQuestionType(),
                question.isRequired(),
                question.getSortOrder()
        );
    }

    private void createOutboxMessage(Event event, String eventType) {
        EventOutboxMessage message = new EventOutboxMessage();
        message.setAggregateId(event.getId());
        message.setEventType(eventType);
        message.setPayloadJson(toPayloadJson(event, eventType));
        message.setStatus(OutboxStatus.PENDING);
        message.setCreatedAt(Instant.now());
        outboxRepository.save(message);
    }

    private String toPayloadJson(Event event, String eventType) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("eventType", eventType);
        payload.put("eventId", event.getId());
        payload.put("organizerId", event.getOrganizerId());
        payload.put("title", event.getTitle());
        payload.put("startsAt", event.getStartsAt());
        payload.put("capacity", event.getCapacity());
        payload.put("status", event.getStatus().name());
        payload.put("eventFormat", event.getEventFormat().name());
        payload.put("venueName", event.getVenueName());
        payload.put("timezone", event.getTimezone());
        payload.put("registrationTypes", typeRepository.findByEventIdAndActiveTrueOrderBySortOrderAsc(event.getId()).stream()
                .map(type -> Map.of(
                        "registrationTypeId", type.getId(),
                        "name", type.getName(),
                        "capacity", type.getCapacity(),
                        "active", type.isActive()
                ))
                .toList());
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JacksonException ex) {
            throw new IllegalStateException("Unable to serialize event outbox payload", ex);
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
