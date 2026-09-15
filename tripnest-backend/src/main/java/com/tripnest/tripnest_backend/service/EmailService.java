package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.entity.User;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String configuredSenderUsername;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Autowired
    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    private String getSenderEmail() {
        if (configuredSenderUsername != null && !configuredSenderUsername.trim().isEmpty()) {
            return configuredSenderUsername.trim();
        }
        String envUser = System.getenv("SPRING_MAIL_USERNAME");
        if (envUser != null && !envUser.trim().isEmpty()) {
            return envUser.trim();
        }
        return "";
    }

    private String getFrontendBaseUrl() {
        if (frontendBaseUrl != null && !frontendBaseUrl.trim().isEmpty()) {
            return frontendBaseUrl.trim().replaceAll("/+$", "");
        }
        return "http://localhost:5173";
    }

    @Async
    public void sendEmail(String toEmail, String subject, String body) {
        if (mailSender == null) {
            log.info("[TripNest Mail] JavaMailSender is not configured. Skipping email to: {}", toEmail);
            return;
        }

        if (toEmail == null || toEmail.trim().isEmpty()) {
            log.warn("[TripNest Mail] Recipient email is empty. Skipping email.");
            return;
        }

        String from = getSenderEmail();
        if (from.isEmpty()) {
            log.warn("[TripNest Mail] Sender email is not configured. Skipping email to: {}", toEmail);
            return;
        }

        try {
            log.info("[TripNest Mail] Preparing email");
            log.info("[TripNest Mail] Recipient configured");
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("TripNest <" + from + ">");
            message.setTo(toEmail.trim());
            message.setSubject(subject);
            message.setText(body);
            log.info("[TripNest Mail] Sending email");
            mailSender.send(message);
            log.info("[TripNest Mail] Email sent successfully");
        } catch (Exception ex) {
            log.warn("[TripNest Mail] Email sending failed: {} - {} (Cause: {})",
                    ex.getClass().getSimpleName(),
                    ex.getMessage(),
                    ex.getCause() != null ? ex.getCause().getMessage() : "none");
        }
    }

    public void sendHtmlEmail(String toEmail, String subject, String htmlContent) {
        sendHtmlEmail(toEmail, subject, htmlContent, null);
    }

    @Async
    public void sendHtmlEmail(String toEmail, String subject, String htmlContent, String replyTo) {
        if (mailSender == null) {
            log.info("[TripNest Mail] JavaMailSender is not configured. Skipping HTML email to: {}", toEmail);
            return;
        }

        if (toEmail == null || toEmail.trim().isEmpty()) {
            log.warn("[TripNest Mail] Recipient email is empty. Skipping HTML email.");
            return;
        }

        String from = getSenderEmail();
        if (from.isEmpty()) {
            log.warn("[TripNest Mail] Sender email is not configured. Skipping HTML email to: {}", toEmail);
            return;
        }

        try {
            log.info("[TripNest Mail] Preparing email");
            log.info("[TripNest Mail] Recipient configured");
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(from, "TripNest");
            helper.setTo(toEmail.trim());
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            if (replyTo != null && !replyTo.trim().isEmpty()) {
                helper.setReplyTo(replyTo.trim());
            }
            log.info("[TripNest Mail] Sending email");
            mailSender.send(mimeMessage);
            log.info("[TripNest Mail] Email sent successfully");
        } catch (Exception ex) {
            log.warn("[TripNest Mail] HTML email sending failed: {} - {} (Cause: {})",
                    ex.getClass().getSimpleName(),
                    ex.getMessage(),
                    ex.getCause() != null ? ex.getCause().getMessage() : "none");
        }
    }

    // =====================================================
    // 0. TRIP INVITATION EMAIL (To Invitee with Action Links)
    // =====================================================
    public void sendTripInvitationEmail(
            User inviter,
            User invitee,
            Trip trip,
            String token,
            String frontendBaseUrl) {

        if (invitee == null || invitee.getEmail() == null) return;

        String tripName = getTripName(trip);
        String destination = getTripDestination(trip);
        String inviterName = inviter != null && inviter.getName() != null ? inviter.getName() : "A TripNest traveler";
        String inviterEmail = inviter != null ? inviter.getEmail() : "";
        String inviteeName = invitee.getName() != null ? invitee.getName() : "Traveler";

        String baseUrl = (frontendBaseUrl != null && !frontendBaseUrl.trim().isEmpty())
                ? frontendBaseUrl.trim().replaceAll("/+$", "")
                : "http://localhost:5173";

        String invitationLink = baseUrl + "/trip-invitation/" + token;
        String acceptLink = invitationLink + "?action=accept";
        String rejectLink = invitationLink + "?action=reject";

        String subject = "You've Been Invited to a Trip on TripNest";

        String body = String.format(
                "<p>Hello <strong>%s</strong>,</p>" +
                "<p><strong>%s</strong> has invited you to join the trip \"<strong>%s</strong>\".</p>" +
                "<div style='background:#f8fafc;padding:18px 20px;border-radius:10px;border:1px solid #e2e8f0;margin:18px 0;'>" +
                "  <p style='margin:4px 0;'><strong>Trip:</strong> %s</p>" +
                "  <p style='margin:4px 0;'><strong>Destination:</strong> %s</p>" +
                "  %s" +
                "  <p style='margin:4px 0;padding-top:6px;border-top:1px dashed #e2e8f0;'><strong>Invited by:</strong> %s (%s)</p>" +
                "</div>" +
                "<p style='margin-bottom:20px;'>Please respond to this invitation below:</p>" +
                "<table border='0' cellpadding='0' cellspacing='0' style='margin:20px 0;'>" +
                "  <tr>" +
                "    <td style='padding-right:12px;'>" +
                "      <a href='%s' style='display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px;'>Accept Invitation</a>" +
                "    </td>" +
                "    <td>" +
                "      <a href='%s' style='display:inline-block;background:#ffffff;color:#64748b;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px;border:1px solid #cbd5e1;'>Reject Invitation</a>" +
                "    </td>" +
                "  </tr>" +
                "</table>" +
                "<p style='font-size:12px;color:#94a3b8;margin-top:16px;'>Or open this link directly: <a href='%s' style='color:#0284c7;'>%s</a></p>",
                escapeHtml(inviteeName),
                escapeHtml(inviterName),
                escapeHtml(tripName),
                escapeHtml(tripName),
                escapeHtml(destination),
                getDatesHtml(trip),
                escapeHtml(inviterName),
                escapeHtml(inviterEmail),
                acceptLink,
                rejectLink,
                invitationLink,
                invitationLink
        );

        String html = buildEmailTemplate("Trip Invitation", body);
        sendHtmlEmail(invitee.getEmail(), subject, html, inviterEmail);
    }

    // =====================================================
    // 0B. INVITATION ACCEPTED / REJECTED (To Inviter)
    // =====================================================
    public void sendInvitationAcceptedEmail(User inviter, User invitee, Trip trip) {
        if (inviter == null || inviter.getEmail() == null) return;

        String tripName = getTripName(trip);
        String destination = getTripDestination(trip);
        String inviteeName = invitee != null && invitee.getName() != null ? invitee.getName() : "A traveler";
        String subject = inviteeName + " accepted your invitation to join " + tripName;

        String body = String.format(
                "<p>Hello <strong>%s</strong>,</p>" +
                "<p>Great news! <strong>%s</strong> has accepted your invitation to join \"<strong>%s</strong>\".</p>" +
                "<div style='background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0;'>" +
                "  <p style='margin:4px 0;'><strong>Trip:</strong> %s</p>" +
                "  <p style='margin:4px 0;'><strong>Destination:</strong> %s</p>" +
                "  %s" +
                "</div>" +
                "<p>You can now collaborate on itineraries, budgets, and expenses together in TripNest.</p>",
                escapeHtml(inviter.getName() != null ? inviter.getName() : "Traveler"),
                escapeHtml(inviteeName),
                escapeHtml(tripName),
                escapeHtml(tripName),
                escapeHtml(destination),
                getDatesHtml(trip)
        );

        String html = buildEmailTemplate("Invitation Accepted", body);
        sendHtmlEmail(inviter.getEmail(), subject, html);
    }

    public void sendInvitationRejectedEmail(User inviter, User invitee, Trip trip) {
        if (inviter == null || inviter.getEmail() == null) return;

        String tripName = getTripName(trip);
        String destination = getTripDestination(trip);
        String inviteeName = invitee != null && invitee.getName() != null ? invitee.getName() : "A traveler";
        String subject = inviteeName + " declined your invitation to join " + tripName;

        String body = String.format(
                "<p>Hello <strong>%s</strong>,</p>" +
                "<p><strong>%s</strong> was unable to accept your invitation to join \"<strong>%s</strong>\".</p>" +
                "<div style='background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0;'>" +
                "  <p style='margin:4px 0;'><strong>Trip:</strong> %s</p>" +
                "  <p style='margin:4px 0;'><strong>Destination:</strong> %s</p>" +
                "</div>" +
                "<p>You can invite other travel companions anytime from TripNest.</p>",
                escapeHtml(inviter.getName() != null ? inviter.getName() : "Traveler"),
                escapeHtml(inviteeName),
                escapeHtml(tripName),
                escapeHtml(tripName),
                escapeHtml(destination)
        );

        String html = buildEmailTemplate("Invitation Update", body);
        sendHtmlEmail(inviter.getEmail(), subject, html);
    }

    // =====================================================
    // 1. JOIN REQUEST EMAIL (To Trip Owner)
    // =====================================================
    public void sendJoinRequestEmail(User owner, String requesterName, String requesterEmail, Trip trip) {
        if (owner == null || owner.getEmail() == null) return;

        String tripName = getTripName(trip);
        String destination = getTripDestination(trip);
        String subject = "New Join Request for " + tripName;
        String tripUrl = getFrontendBaseUrl() + "/trips";
        if (trip != null && trip.getId() != null) {
            tripUrl = getFrontendBaseUrl() + "/trips/" + trip.getId();
        }

        String requesterInfo = (requesterEmail != null && !requesterEmail.trim().isEmpty())
                ? String.format("%s (%s)", escapeHtml(requesterName), escapeHtml(requesterEmail))
                : escapeHtml(requesterName != null ? requesterName : "A traveler");

        String body = String.format(
                "<p>Hello <strong>%s</strong>,</p>" +
                "<p><strong>%s</strong> has requested to join your trip \"<strong>%s</strong>\".</p>" +
                "<div style='background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0;'>" +
                "<p style='margin:4px 0;'><strong>Trip:</strong> %s</p>" +
                "<p style='margin:4px 0;'><strong>Destination:</strong> %s</p>" +
                "%s" +
                "<p style='margin:4px 0;padding-top:6px;border-top:1px dashed #e2e8f0;'><strong>Requester:</strong> %s</p>" +
                "</div>" +
                "<p>Please open TripNest to review and manage this request.</p>" +
                "<p style='margin:20px 0;'>" +
                "  <a href='%s' style='display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px;'>Review Request</a>" +
                "</p>",
                escapeHtml(owner.getName() != null ? owner.getName() : "Traveler"),
                escapeHtml(requesterName != null ? requesterName : "A traveler"),
                escapeHtml(tripName),
                escapeHtml(tripName),
                escapeHtml(destination),
                getDatesHtml(trip),
                requesterInfo,
                tripUrl
        );

        String html = buildEmailTemplate("New Join Request", body);
        sendHtmlEmail(owner.getEmail(), subject, html, requesterEmail);
    }

    public void sendJoinRequestEmail(User owner, String requesterName, Trip trip) {
        sendJoinRequestEmail(owner, requesterName, null, trip);
    }

    // =====================================================
    // 2. JOIN REQUEST APPROVED EMAIL (To Original Requester)
    // =====================================================
    public void sendJoinRequestApprovedEmail(User requester, Trip trip) {
        if (requester == null || requester.getEmail() == null) return;

        String tripName = getTripName(trip);
        String destination = getTripDestination(trip);
        String subject = "Your Trip Request Was Accepted";
        String tripUrl = getFrontendBaseUrl() + "/trips";
        if (trip != null && trip.getId() != null) {
            tripUrl = getFrontendBaseUrl() + "/trips/" + trip.getId();
        }

        String body = String.format(
                "<p>Hello <strong>%s</strong>,</p>" +
                "<p>Good news! Your request to join \"<strong>%s</strong>\" has been accepted.</p>" +
                "<div style='background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0;'>" +
                "<p style='margin:4px 0;'><strong>Trip:</strong> %s</p>" +
                "<p style='margin:4px 0;'><strong>Destination:</strong> %s</p>" +
                "%s" +
                "</div>" +
                "<p>Your request to join this trip has been accepted. You can now open TripNest to view the trip details, full itinerary, and collaborative expenses.</p>" +
                "<p style='margin:20px 0;'>" +
                "  <a href='%s' style='display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px;'>View Trip</a>" +
                "</p>",
                escapeHtml(requester.getName() != null ? requester.getName() : "Traveler"),
                escapeHtml(tripName),
                escapeHtml(tripName),
                escapeHtml(destination),
                getDatesHtml(trip),
                tripUrl
        );

        String html = buildEmailTemplate("Join Request Approved", body);
        sendHtmlEmail(requester.getEmail(), subject, html);
    }

    // =====================================================
    // 3. JOIN REQUEST REJECTED EMAIL (To Original Requester)
    // =====================================================
    public void sendJoinRequestRejectedEmail(User requester, Trip trip) {
        if (requester == null || requester.getEmail() == null) return;

        String tripName = getTripName(trip);
        String destination = getTripDestination(trip);
        String subject = "Your Trip Request Was Rejected";

        String body = String.format(
                "<p>Hello <strong>%s</strong>,</p>" +
                "<p>Your request to join \"<strong>%s</strong>\" was not approved.</p>" +
                "<div style='background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0;'>" +
                "<p style='margin:4px 0;'><strong>Trip:</strong> %s</p>" +
                "<p style='margin:4px 0;'><strong>Destination:</strong> %s</p>" +
                "</div>" +
                "<p>You can open TripNest to explore your other trips and discover new destinations.</p>",
                escapeHtml(requester.getName() != null ? requester.getName() : "Traveler"),
                escapeHtml(tripName),
                escapeHtml(tripName),
                escapeHtml(destination)
        );

        String html = buildEmailTemplate("Join Request Update", body);
        sendHtmlEmail(requester.getEmail(), subject, html);
    }

    // =====================================================
    // 4. MEMBER ADDED EMAIL (To Newly Added Member)
    // =====================================================
    public void sendMemberAddedEmail(User member, Trip trip) {
        if (member == null || member.getEmail() == null) return;

        String tripName = getTripName(trip);
        String destination = getTripDestination(trip);
        String subject = "You've Been Added to a Trip on TripNest";

        String body = String.format(
                "<p>Hello <strong>%s</strong>,</p>" +
                "<p>You have been added as a member of the trip: \"<strong>%s</strong>\".</p>" +
                "<div style='background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0;'>" +
                "<p style='margin:4px 0;'><strong>Trip:</strong> %s</p>" +
                "<p style='margin:4px 0;'><strong>Destination:</strong> %s</p>" +
                "%s" +
                "</div>" +
                "<p>Open TripNest to view the full trip itinerary, budget, and members.</p>",
                escapeHtml(member.getName() != null ? member.getName() : "Traveler"),
                escapeHtml(tripName),
                escapeHtml(tripName),
                escapeHtml(destination),
                getDatesHtml(trip)
        );

        String html = buildEmailTemplate("Added to Trip", body);
        sendHtmlEmail(member.getEmail(), subject, html);
    }

    // =====================================================
    // 5. LOGIN NOTIFICATION EMAIL (To Logged In User)
    // =====================================================
    public void sendLoginNotificationEmail(User user, LocalDateTime loginTime) {
        if (user == null || user.getEmail() == null) return;

        String formattedTime = loginTime != null
                ? loginTime.format(DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' hh:mm:ss a"))
                : LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' hh:mm:ss a"));

        String subject = "New Login to Your TripNest Account";

        String body = String.format(
                "<p>Hello <strong>%s</strong>,</p>" +
                "<p>You have successfully logged in to your TripNest account.</p>" +
                "<div style='background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0;'>" +
                "<p style='margin:4px 0;'><strong>Account Email:</strong> %s</p>" +
                "<p style='margin:4px 0;'><strong>Login Time:</strong> %s</p>" +
                "</div>" +
                "<p style='color:#dc2626;'>If this was not you, please secure your account immediately or change your password.</p>",
                escapeHtml(user.getName() != null ? user.getName() : "Traveler"),
                escapeHtml(user.getEmail()),
                escapeHtml(formattedTime)
        );

        String html = buildEmailTemplate("Account Login", body);
        sendHtmlEmail(user.getEmail(), subject, html);
    }

    // =====================================================
    // 6. REMINDER NOTIFICATION EMAIL (Trip & Activity)
    // =====================================================
    public void sendReminderEmail(User user, String title, String reminderMessage, Trip trip) {
        if (user == null || user.getEmail() == null) return;

        String tripName = getTripName(trip);
        String destination = getTripDestination(trip);
        String subject = "TripNest Reminder: " + title;

        String body = String.format(
                "<p>Hello <strong>%s</strong>,</p>" +
                "<p>%s</p>" +
                "<div style='background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0;'>" +
                "<p style='margin:4px 0;'><strong>Trip:</strong> %s</p>" +
                "<p style='margin:4px 0;'><strong>Destination:</strong> %s</p>" +
                "%s" +
                "</div>" +
                "<p>Open TripNest to view your schedule and activities.</p>",
                escapeHtml(user.getName() != null ? user.getName() : "Traveler"),
                escapeHtml(reminderMessage),
                escapeHtml(tripName),
                escapeHtml(destination),
                getDatesHtml(trip)
        );

        String html = buildEmailTemplate(title, body);
        sendHtmlEmail(user.getEmail(), subject, html);
    }

    // =====================================================
    // HTML TEMPLATE BUILDER
    // =====================================================
    private String buildEmailTemplate(String headerTitle, String bodyHtml) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta charset='UTF-8'>" +
                "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "</head>" +
                "<body style='margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif;color:#334155;line-height:1.6;'>" +
                "<table align='center' border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width:600px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);'>" +
                "  <!-- Header -->" +
                "  <tr>" +
                "    <td style='background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%);padding:24px 32px;text-align:left;'>" +
                "      <table width='100%'><tr>" +
                "        <td style='font-size:24px;font-weight:800;color:#ffffff;'>✈️ TripNest</td>" +
                "        <td style='text-align:right;font-size:14px;font-weight:600;color:#e0f2fe;'>" + escapeHtml(headerTitle) + "</td>" +
                "      </tr></table>" +
                "    </td>" +
                "  </tr>" +
                "  <!-- Body -->" +
                "  <tr>" +
                "    <td style='padding:32px;font-size:15px;color:#334155;'>" +
                bodyHtml +
                "    </td>" +
                "  </tr>" +
                "  <!-- Footer -->" +
                "  <tr>" +
                "    <td style='background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#94a3b8;'>" +
                "      <p style='margin:0 0 4px;'>This is an automated notification from <strong>TripNest</strong>.</p>" +
                "      <p style='margin:0;'>Travel Planning & Trip Management Platform</p>" +
                "    </td>" +
                "  </tr>" +
                "</table>" +
                "</body>" +
                "</html>";
    }

    private String getTripName(Trip trip) {
        if (trip == null) return "Trip";
        if (trip.getDestination() != null && trip.getDestination().getName() != null) {
            return trip.getDestination().getName();
        }
        return "Trip #" + trip.getId();
    }

    private String getTripDestination(Trip trip) {
        if (trip == null || trip.getDestination() == null || trip.getDestination().getName() == null) {
            return "Custom Destination";
        }
        return trip.getDestination().getName();
    }

    private String getDatesHtml(Trip trip) {
        if (trip == null || trip.getStartDate() == null || trip.getEndDate() == null) {
            return "";
        }
        return String.format("<p style='margin:4px 0;'><strong>Dates:</strong> %s to %s</p>",
                trip.getStartDate().toString(),
                trip.getEndDate().toString());
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
