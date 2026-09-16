package com.tripnest.tripnest_backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class MailConfigDiagnosticRunner implements CommandLineRunner {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.port:}")
    private String mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    public MailConfigDiagnosticRunner(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void run(String... args) {
        log.info("=================================================");
        log.info("[TripNest Mail] Inspecting SMTP Configuration...");

        String envHost = System.getenv("SPRING_MAIL_HOST");
        String envPort = System.getenv("SPRING_MAIL_PORT");
        String envUser = System.getenv("SPRING_MAIL_USERNAME");
        String envPass = System.getenv("SPRING_MAIL_PASSWORD");

        log.info("[TripNest Mail] SPRING_MAIL_HOST: {}", isPresent(envHost, mailHost));
        log.info("[TripNest Mail] SPRING_MAIL_PORT: {}", isPresent(envPort, mailPort));
        log.info("[TripNest Mail] SPRING_MAIL_USERNAME: {}", isPresent(envUser, mailUsername));
        log.info("[TripNest Mail] SPRING_MAIL_PASSWORD: {}", isPresent(envPass, mailPassword));

        if (mailSender != null) {
            log.info("[TripNest Mail] JavaMailSender bean: INITIALIZED");
        } else {
            log.warn("[TripNest Mail] JavaMailSender bean: NOT AVAILABLE (emails will be skipped)");
        }

        if (hasText(mailUsername)) {
            log.info("[TripNest Mail] Configured sender account: {}", mailUsername.trim());
        } else {
            log.warn("[TripNest Mail] No SMTP username configured. Set SPRING_MAIL_USERNAME environment variable.");
        }

        log.info("=================================================");
    }

    private String isPresent(String envVal, String propVal) {
        return (hasText(envVal) || hasText(propVal)) ? "PRESENT" : "MISSING";
    }

    private boolean hasText(String str) {
        return str != null && !str.trim().isEmpty();
    }
}
