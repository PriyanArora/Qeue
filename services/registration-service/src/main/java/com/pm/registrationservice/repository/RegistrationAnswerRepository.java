package com.pm.registrationservice.repository;

import com.pm.registrationservice.model.RegistrationAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface RegistrationAnswerRepository extends JpaRepository<RegistrationAnswer, UUID> {
    List<RegistrationAnswer> findByRegistrationId(UUID registrationId);

    List<RegistrationAnswer> findByRegistrationIdIn(Collection<UUID> registrationIds);
}
