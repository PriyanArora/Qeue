CREATE TABLE registration_questions (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL,
    question_text VARCHAR(500) NOT NULL,
    question_type VARCHAR(30) NOT NULL,
    required BOOLEAN NOT NULL,
    sort_order INTEGER NOT NULL,
    active BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_registration_questions_event
        FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE INDEX idx_registration_questions_event_sort
    ON registration_questions(event_id, sort_order);

CREATE TABLE registration_types (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    active BOOLEAN NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_registration_types_event
        FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE INDEX idx_registration_types_event_sort
    ON registration_types(event_id, sort_order);

CREATE TABLE speakers (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL,
    name VARCHAR(160) NOT NULL,
    title VARCHAR(160) NOT NULL,
    organization VARCHAR(160) NOT NULL,
    bio TEXT NOT NULL,
    photo_url VARCHAR(500),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_speakers_event
        FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE INDEX idx_speakers_event_name ON speakers(event_id, name);

CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL,
    title VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP NOT NULL,
    room_name VARCHAR(120) NOT NULL,
    capacity INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_sessions_event
        FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE INDEX idx_sessions_event_start ON sessions(event_id, starts_at);
CREATE INDEX idx_sessions_event_status_start ON sessions(event_id, status, starts_at);

CREATE TABLE session_speakers (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL,
    speaker_id UUID NOT NULL,
    CONSTRAINT fk_session_speakers_session
        FOREIGN KEY (session_id) REFERENCES sessions(id),
    CONSTRAINT fk_session_speakers_speaker
        FOREIGN KEY (speaker_id) REFERENCES speakers(id),
    CONSTRAINT uk_session_speaker UNIQUE (session_id, speaker_id)
);

CREATE TABLE surveys (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL,
    title VARCHAR(160) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_surveys_event
        FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE INDEX idx_surveys_event_created ON surveys(event_id, created_at);
CREATE INDEX idx_surveys_event_status_created ON surveys(event_id, status, created_at);

CREATE TABLE survey_questions (
    id UUID PRIMARY KEY,
    survey_id UUID NOT NULL,
    question_text VARCHAR(500) NOT NULL,
    question_type VARCHAR(30) NOT NULL,
    required BOOLEAN NOT NULL,
    sort_order INTEGER NOT NULL,
    CONSTRAINT fk_survey_questions_survey
        FOREIGN KEY (survey_id) REFERENCES surveys(id)
);

CREATE INDEX idx_survey_questions_survey_sort
    ON survey_questions(survey_id, sort_order);
