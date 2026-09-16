package com.tripnest.tripnest_backend.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class SmtpRealEmailTest {

    @Autowired
    private EmailService emailService;

    @Test
    public void testSendRealEmail() {
        System.out.println("Testing EmailService sending email...");
        emailService.sendEmail("tripnest.travel.app@gmail.com", "TripNest Verification Test Email", "This email confirms that TripNest SMTP integration is 100% operational.");
    }


}
