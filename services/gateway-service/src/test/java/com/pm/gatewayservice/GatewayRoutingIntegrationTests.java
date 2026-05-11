package com.pm.gatewayservice;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.ObjectMapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "gateway.routes.identity-url=http://identity-service.test",
        "gateway.routes.event-url=http://event-service.test",
        "gateway.routes.registration-url=http://registration-service.test",
        "gateway.jwt.secret=test-gateway-secret-minimum-32-characters",
        "gateway.jwt.issuer=test-issuer"
})
@AutoConfigureMockMvc
class GatewayRoutingIntegrationTests {
    private static final String SECRET = "test-gateway-secret-minimum-32-characters";
    private static final String ISSUER = "test-issuer";
    private static final UUID USER_ID = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    private MockRestServiceServer downstream;

    @BeforeEach
    void setUp() {
        downstream = MockRestServiceServer.bindTo(restTemplate).build();
    }

    @Test
    void routesPublicEventListWithoutToken() throws Exception {
        downstream.expect(once(), requestTo("http://event-service.test/api/events"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("[{\"title\":\"Published Event\"}]", MediaType.APPLICATION_JSON));

        mockMvc.perform(get("/api/events"))
                .andExpect(status().isOk())
                .andExpect(content().json("[{\"title\":\"Published Event\"}]"));

        downstream.verify();
    }

    @Test
    void rejectsOrganizerRouteWithoutToken() throws Exception {
        mockMvc.perform(post("/api/organizer/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsOrganizerRouteWithAttendeeToken() throws Exception {
        mockMvc.perform(post("/api/organizer/events")
                        .header("Authorization", "Bearer " + token("ATTENDEE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void rejectsAttendeeRouteWithOrganizerToken() throws Exception {
        mockMvc.perform(post("/api/events/11111111-1111-1111-1111-111111111001/registrations")
                        .header("Authorization", "Bearer " + token("ORGANIZER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void rejectsInvalidToken() throws Exception {
        mockMvc.perform(post("/api/organizer/events")
                        .header("Authorization", "Bearer invalid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void forwardsOrganizerHeadersAfterTokenValidation() throws Exception {
        downstream.expect(once(), requestTo("http://event-service.test/api/organizer/events"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("X-User-Id", USER_ID.toString()))
                .andExpect(header("X-User-Email", "organizer@example.com"))
                .andExpect(header("X-User-Role", "ORGANIZER"))
                .andRespond(withStatus(HttpStatus.CREATED)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"status\":\"DRAFT\"}"));

        mockMvc.perform(post("/api/organizer/events")
                        .header("Authorization", "Bearer " + token("ORGANIZER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andExpect(content().json("{\"status\":\"DRAFT\"}"));

        downstream.verify();
    }

    private String token(String role) throws Exception {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plusSeconds(3600);
        String header = encodeJson(Map.of("alg", "HS256", "typ", "JWT"));
        String payload = encodeJson(Map.of(
                "iss", ISSUER,
                "sub", USER_ID.toString(),
                "email", "organizer@example.com",
                "role", role,
                "iat", issuedAt.getEpochSecond(),
                "exp", expiresAt.getEpochSecond()
        ));
        String signingInput = header + "." + payload;
        return signingInput + "." + sign(signingInput);
    }

    private String encodeJson(Map<String, Object> value) throws Exception {
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(objectMapper.writeValueAsString(value).getBytes(StandardCharsets.UTF_8));
    }

    private String sign(String signingInput) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8)));
    }
}
