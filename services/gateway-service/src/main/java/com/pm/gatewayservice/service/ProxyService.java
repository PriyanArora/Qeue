package com.pm.gatewayservice.service;

import com.pm.gatewayservice.config.GatewayRouteProperties;
import com.pm.gatewayservice.security.GatewayPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Service
public class ProxyService {
    private final GatewayRouteProperties routeProperties;
    private final RestTemplate restTemplate;

    public ProxyService(GatewayRouteProperties routeProperties, RestTemplate restTemplate) {
        this.routeProperties = routeProperties;
        this.restTemplate = restTemplate;
    }

    public ResponseEntity<byte[]> proxy(HttpServletRequest request, GatewayPrincipal principal) throws IOException {
        String targetUrl = buildTargetUrl(request);
        HttpHeaders headers = buildHeaders(request, principal);
        byte[] body = StreamUtils.copyToByteArray(request.getInputStream());
        HttpEntity<byte[]> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    targetUrl,
                    HttpMethod.valueOf(request.getMethod()),
                    entity,
                    byte[].class
            );
            return ResponseEntity.status(response.getStatusCode())
                    .headers(filterResponseHeaders(response.getHeaders()))
                    .body(response.getBody());
        } catch (RestClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Downstream service unavailable");
        }
    }

    private String buildTargetUrl(HttpServletRequest request) {
        String path = request.getRequestURI();
        String baseUrl = targetBaseUrl(path);
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(baseUrl + path);
        if (request.getQueryString() != null) {
            builder.query(request.getQueryString());
        }
        return builder.build(true).toUriString();
    }

    private String targetBaseUrl(String path) {
        if (path.startsWith("/api/auth/")) {
            return routeProperties.identityUrl();
        }
        if (isRegistrationPath(path)) {
            return routeProperties.registrationUrl();
        }
        if (path.startsWith("/api/events") || path.startsWith("/api/organizer/events")) {
            return routeProperties.eventUrl();
        }
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No gateway route matched");
    }

    private boolean isRegistrationPath(String path) {
        return path.matches("^/api/events/[^/]+/registrations.*")
                || path.matches("^/api/events/[^/]+/surveys/[^/]+/responses.*")
                || path.matches("^/api/organizer/events/[^/]+/registrations.*")
                || path.matches("^/api/organizer/events/[^/]+/check-in.*")
                || path.matches("^/api/organizer/events/[^/]+/analytics.*")
                || path.matches("^/api/organizer/events/[^/]+/surveys/[^/]+/responses.*")
                || path.startsWith("/api/registrations/")
                || path.equals("/api/registrations")
                || path.equals("/api/me/registrations")
                || path.startsWith("/api/me/registrations/");
    }

    private HttpHeaders buildHeaders(HttpServletRequest request, GatewayPrincipal principal) {
        HttpHeaders headers = new HttpHeaders();
        if (request.getContentType() != null) {
            headers.set(HttpHeaders.CONTENT_TYPE, request.getContentType());
        }
        String accept = request.getHeader(HttpHeaders.ACCEPT);
        if (accept != null && !accept.isBlank()) {
            headers.set(HttpHeaders.ACCEPT, accept);
        }
        if (principal != null) {
            headers.set("X-User-Id", principal.userId().toString());
            headers.set("X-User-Email", principal.email());
            headers.set("X-User-Role", principal.role());
        }
        return headers;
    }

    private HttpHeaders filterResponseHeaders(HttpHeaders source) {
        HttpHeaders headers = new HttpHeaders();
        if (source.getContentType() != null) {
            headers.setContentType(source.getContentType());
        }
        return headers;
    }
}
