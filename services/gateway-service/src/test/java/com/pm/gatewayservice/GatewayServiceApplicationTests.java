package com.pm.gatewayservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "gateway.jwt.secret=test-gateway-secret-minimum-32-characters",
        "gateway.jwt.issuer=test-issuer"
})
class GatewayServiceApplicationTests {
    @Test
    void contextLoads() {
    }
}
