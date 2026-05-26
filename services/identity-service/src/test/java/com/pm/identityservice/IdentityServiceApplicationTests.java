package com.pm.identityservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "identity.jwt.secret=test-identity-secret-minimum-32-characters",
        "identity.jwt.issuer=qeue-identity",
        "identity.jwt.expiration-minutes=60"
})
class IdentityServiceApplicationTests {
    @Test
    void contextLoads() {
    }
}
