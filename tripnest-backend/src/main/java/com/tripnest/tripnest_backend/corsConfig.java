package com.tripnest.tripnest_backend;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class corsConfig {

    @Value("${app.frontend.base-url:}")
    private String configuredFrontendUrl;

    private void addCleanOrigin(List<String> list, String origin) {
        if (origin == null || origin.isBlank()) {
            return;
        }
        String clean = origin.trim();
        while (clean.endsWith("/")) {
            clean = clean.substring(0, clean.length() - 1);
        }
        if (!clean.isEmpty() && !list.contains(clean)) {
            list.add(clean);
        }
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        // Build allowed origins
        List<String> allowedOrigins = new ArrayList<>();
        addCleanOrigin(allowedOrigins, "https://travel-planning-trip-management-platform-91g1.onrender.com");
        addCleanOrigin(allowedOrigins, "http://localhost:5173");
        addCleanOrigin(allowedOrigins, "http://localhost:3000");

        // Add origin from environment variable FRONTEND_BASE_URL if provided
        addCleanOrigin(allowedOrigins, System.getenv("FRONTEND_BASE_URL"));

        // Add origin from application.properties app.frontend.base-url if configured
        addCleanOrigin(allowedOrigins, configuredFrontendUrl);

        configuration.setAllowedOrigins(allowedOrigins);

        configuration.setAllowedMethods(
                List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
        );

        configuration.setAllowedHeaders(
                List.of("Authorization", "Content-Type", "Accept", "Origin",
                        "X-Requested-With", "Access-Control-Request-Method",
                        "Access-Control-Request-Headers")
        );

        configuration.setExposedHeaders(
                List.of("Authorization", "Content-Type")
        );

        configuration.setAllowCredentials(true);

        // Cache preflight response for 1 hour
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
