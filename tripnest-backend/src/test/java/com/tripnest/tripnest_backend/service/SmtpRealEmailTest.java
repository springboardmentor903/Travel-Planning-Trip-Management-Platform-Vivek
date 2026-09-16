package com.tripnest.tripnest_backend.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

@SpringBootTest
public class SmtpRealEmailTest {

    @Autowired(required = false)
    private EmailService emailService;

    @Test
    public void testSendEmailGraceful() {
        if (emailService != null) {
            assertDoesNotThrow(() ->
                emailService.sendEmail("test@example.com", "TripNest Verification Test Email", "This email confirms that TripNest Resend integration is operational.")
            );
        }
    }
}

