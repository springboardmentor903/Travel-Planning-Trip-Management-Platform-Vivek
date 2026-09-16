package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.entity.Destination;
import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private EmailService emailService;

    private User owner;
    private User requester;
    private Trip trip;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "resendApiKey", "re_test_123456789");
        ReflectionTestUtils.setField(emailService, "configuredMailFrom", "onboarding@resend.dev");

        owner = new User();
        owner.setId(1);
        owner.setName("Trip Owner");
        owner.setEmail("owner@example.com");

        requester = new User();
        requester.setId(2);
        requester.setName("Alice Traveler");
        requester.setEmail("alice@example.com");

        Destination dest = new Destination();
        dest.setId(1);
        dest.setName("Goa");

        trip = new Trip();
        trip.setId(10);
        trip.setUser(owner);
        trip.setDestination(dest);
        trip.setStartDate(LocalDate.of(2026, 10, 1));
        trip.setEndDate(LocalDate.of(2026, 10, 5));
    }

    @Test
    void testSendJoinRequestEmail_Success() {
        when(restTemplate.postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"id\":\"123\"}", HttpStatus.OK));

        assertDoesNotThrow(() ->
                emailService.sendJoinRequestEmail(owner, "Alice Traveler", trip)
        );

        verify(restTemplate, times(1)).postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void testSendJoinRequestApprovedEmail_Success() {
        when(restTemplate.postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"id\":\"123\"}", HttpStatus.OK));

        assertDoesNotThrow(() ->
                emailService.sendJoinRequestApprovedEmail(requester, trip)
        );

        verify(restTemplate, times(1)).postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void testSendJoinRequestRejectedEmail_Success() {
        when(restTemplate.postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"id\":\"123\"}", HttpStatus.OK));

        assertDoesNotThrow(() ->
                emailService.sendJoinRequestRejectedEmail(requester, trip)
        );

        verify(restTemplate, times(1)).postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void testSendMemberAddedEmail_Success() {
        when(restTemplate.postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"id\":\"123\"}", HttpStatus.OK));

        assertDoesNotThrow(() ->
                emailService.sendMemberAddedEmail(requester, trip)
        );

        verify(restTemplate, times(1)).postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void testSendLoginNotificationEmail_Success() {
        when(restTemplate.postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"id\":\"123\"}", HttpStatus.OK));

        assertDoesNotThrow(() ->
                emailService.sendLoginNotificationEmail(requester, LocalDateTime.now())
        );

        verify(restTemplate, times(1)).postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void testSendEmail_GracefulFailureWhenRestTemplateThrows() {
        when(restTemplate.postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("Connection Refused"));

        assertDoesNotThrow(() ->
                emailService.sendEmail("test@example.com", "Test Subject", "Test Body")
        );
    }

    @Test
    void testSendHtmlEmail_GracefulFailureWhenResendReturns4xx() {
        when(restTemplate.postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new HttpClientErrorException(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error"));

        assertDoesNotThrow(() ->
                emailService.sendHtmlEmail("test@example.com", "Test Subject", "<p>Test</p>")
        );
    }

    @Test
    void testEmailService_WhenApiKeyIsMissing() {
        EmailService serviceWithoutKey = new EmailService(restTemplate);
        ReflectionTestUtils.setField(serviceWithoutKey, "resendApiKey", "");

        assertDoesNotThrow(() -> {
            serviceWithoutKey.sendEmail("test@example.com", "Subject", "Body");
            serviceWithoutKey.sendHtmlEmail("test@example.com", "Subject", "<p>Html</p>");
            serviceWithoutKey.sendLoginNotificationEmail(requester, LocalDateTime.now());
        });

        verify(restTemplate, never()).postForEntity(any(), any(), any());
    }

    @Test
    void testEmailService_WhenRecipientIsEmpty() {
        assertDoesNotThrow(() -> {
            emailService.sendEmail("", "Subject", "Body");
            emailService.sendHtmlEmail(null, "Subject", "<p>Html</p>");
        });

        verify(restTemplate, never()).postForEntity(any(), any(), any());
    }

    @Test
    void testSendTripInvitationEmail_Success() {
        when(restTemplate.postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"id\":\"123\"}", HttpStatus.OK));

        assertDoesNotThrow(() ->
                emailService.sendTripInvitationEmail(owner, requester, trip, "token-1234", "http://localhost:5173")
        );

        verify(restTemplate, times(1)).postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void testSendInvitationAcceptedEmail_Success() {
        when(restTemplate.postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"id\":\"123\"}", HttpStatus.OK));

        assertDoesNotThrow(() ->
                emailService.sendInvitationAcceptedEmail(owner, requester, trip)
        );

        verify(restTemplate, times(1)).postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void testSendInvitationRejectedEmail_Success() {
        when(restTemplate.postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"id\":\"123\"}", HttpStatus.OK));

        assertDoesNotThrow(() ->
                emailService.sendInvitationRejectedEmail(owner, requester, trip)
        );

        verify(restTemplate, times(1)).postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void testSendReminderEmail_Success() {
        when(restTemplate.postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"id\":\"123\"}", HttpStatus.OK));

        assertDoesNotThrow(() ->
                emailService.sendReminderEmail(requester, "Upcoming Trip", "Starts tomorrow!", trip)
        );

        verify(restTemplate, times(1)).postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void testSendJoinRequestEmail_WithRequesterEmail_Success() {
        when(restTemplate.postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"id\":\"123\"}", HttpStatus.OK));

        assertDoesNotThrow(() ->
                emailService.sendJoinRequestEmail(owner, "Alice Traveler", "alice@example.com", trip)
        );

        verify(restTemplate, times(1)).postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(String.class));
    }
}

