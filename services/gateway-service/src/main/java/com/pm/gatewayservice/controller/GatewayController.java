package com.pm.gatewayservice.controller;

import com.pm.gatewayservice.security.GatewayPrincipal;
import com.pm.gatewayservice.service.ProxyService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
public class GatewayController {
    private final ProxyService proxyService;

    public GatewayController(ProxyService proxyService) {
        this.proxyService = proxyService;
    }

    @GetMapping("/api/internal/health")
    public Map<String, String> health() {
        return Map.of("status", "UP", "service", "gateway-service");
    }

    @RequestMapping(path = {
            "/api/auth/**",
            "/api/events/**",
            "/api/organizer/events/**",
            "/api/registrations/**",
            "/api/me/registrations"
    })
    public ResponseEntity<byte[]> proxy(HttpServletRequest request,
                                        @AuthenticationPrincipal GatewayPrincipal principal) throws IOException {
        return proxyService.proxy(request, principal);
    }
}
