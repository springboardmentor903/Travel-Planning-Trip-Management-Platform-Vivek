package com.tripnest.tripnest_backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class MailConfigDiagnosticRunner implements CommandLineRunner {

    @Value("${resend.api.key:${RESEND_API_KEY:}}")
    private String resendApiKey;

    @Value("${resend.mail.from:${MAIL_FROM:}}")
    private String mailFrom;

    @Override
    public void run(String... args) {
        log.info("=================================================");
        log.info("[TripNest Mail] Inspecting Resend Email Configuration...");

        String envApiKey = System.getenv("RESEND_API_KEY");
        String envMailFrom = System.getenv("MAIL_FROM");

        boolean isKeyPresent = hasText(resendApiKey) || hasText(envApiKey);
        String resolvedMailFrom = hasText(mailFrom) ? mailFrom.trim() : (hasText(envMailFrom) ? envMailFrom.trim() : "onboarding@resend.dev");

        log.info("[TripNest Mail] RESEND_API_KEY: {}", isKeyPresent ? "PRESENT" : "MISSING");
        log.info("[TripNest Mail] MAIL_FROM: {}", resolvedMailFrom);

        if (!isKeyPresent) {
            log.warn("[TripNest Mail] RESEND_API_KEY is not configured. Outgoing emails will be skipped safely.");
        } else {
            log.info("[TripNest Mail] Resend email transport is configured.");
        }

        log.info("=================================================");
    }

    private boolean hasText(String str) {
        return str != null && !str.trim().isEmpty();
    }
}

