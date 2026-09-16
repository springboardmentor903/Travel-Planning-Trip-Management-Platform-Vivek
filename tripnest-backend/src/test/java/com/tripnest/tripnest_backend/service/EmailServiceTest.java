package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.entity.Destination;
import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.entity.User;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private MimeMessage mimeMessage;

    @InjectMocks
    private EmailService emailService;

    private User owner;
    private User requester;
    private Trip trip;

    @BeforeEach
    void setUp() {
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
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        assertDoesNotThrow(() ->
                emailService.sendJoinRequestEmail(owner, "Alice Traveler", trip)
        );

        verify(mailSender, times(1)).send(mimeMessage);
    }

    @Test
    void testSendJoinRequestApprovedEmail_Success() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        assertDoesNotThrow(() ->
                emailService.sendJoinRequestApprovedEmail(requester, trip)
        );

        verify(mailSender, times(1)).send(mimeMessage);
    }

    @Test
    void testSendJoinRequestRejectedEmail_Success() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        assertDoesNotThrow(() ->
                emailService.sendJoinRequestRejectedEmail(requester, trip)
        );

        verify(mailSender, times(1)).send(mimeMessage);
    }

    @Test
    void testSendMemberAddedEmail_Success() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        assertDoesNotThrow(() ->
                emailService.sendMemberAddedEmail(requester, trip)
        );

        verify(mailSender, times(1)).send(mimeMessage);
    }

    @Test
    void testSendLoginNotificationEmail_Success() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        assertDoesNotThrow(() ->
                emailService.sendLoginNotificationEmail(requester, LocalDateTime.now())
        );

        verify(mailSender, times(1)).send(mimeMessage);
    }

    @Test
    void testSendEmail_GracefulFailureWhenMailSenderThrows() {
        doThrow(new RuntimeException("SMTP Server Down")).when(mailSender).send(any(SimpleMailMessage.class));

        assertDoesNotThrow(() ->
                emailService.sendEmail("test@example.com", "Test Subject", "Test Body")
        );
    }

    @Test
    void testSendHtmlEmail_GracefulFailureWhenMailSenderThrows() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new RuntimeException("SMTP Connection Refused")).when(mailSender).send(any(MimeMessage.class));

        assertDoesNotThrow(() ->
                emailService.sendHtmlEmail("test@example.com", "Test Subject", "<p>Test</p>")
        );
    }

    @Test
    void testEmailService_WhenMailSenderIsNull() {
        EmailService serviceWithNullSender = new EmailService(null);

        assertDoesNotThrow(() -> {
            serviceWithNullSender.sendEmail("test@example.com", "Subject", "Body");
            serviceWithNullSender.sendHtmlEmail("test@example.com", "Subject", "<p>Html</p>");
            serviceWithNullSender.sendLoginNotificationEmail(requester, LocalDateTime.now());
        });
    }

    @Test
    void testSendTripInvitationEmail_Success() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        assertDoesNotThrow(() ->
                emailService.sendTripInvitationEmail(owner, requester, trip, "token-1234", "http://localhost:5173")
        );

        verify(mailSender, times(1)).send(mimeMessage);
    }

    @Test
    void testSendInvitationAcceptedEmail_Success() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        assertDoesNotThrow(() ->
                emailService.sendInvitationAcceptedEmail(owner, requester, trip)
        );

        verify(mailSender, times(1)).send(mimeMessage);
    }

    @Test
    void testSendInvitationRejectedEmail_Success() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        assertDoesNotThrow(() ->
                emailService.sendInvitationRejectedEmail(owner, requester, trip)
        );

        verify(mailSender, times(1)).send(mimeMessage);
    }

    @Test
    void testSendReminderEmail_Success() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        assertDoesNotThrow(() ->
                emailService.sendReminderEmail(requester, "Upcoming Trip", "Starts tomorrow!", trip)
        );

        verify(mailSender, times(1)).send(mimeMessage);
    }

    @Test
    void testSendJoinRequestEmail_WithRequesterEmail_Success() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        assertDoesNotThrow(() ->
                emailService.sendJoinRequestEmail(owner, "Alice Traveler", "alice@example.com", trip)
        );

        verify(mailSender, times(1)).send(mimeMessage);
    }
}
