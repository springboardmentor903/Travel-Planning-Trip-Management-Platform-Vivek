package com.tripnest.tripnest_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class MailConfig {

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String host;

    @Value("${spring.mail.port:587}")
    private int port;

    @Value("${spring.mail.username:}")
    private String username;

    @Value("${spring.mail.password:}")
    private String password;

    @Bean(name = "mailSender")
    @org.springframework.context.annotation.Primary
    public JavaMailSender mailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(host != null && !host.trim().isEmpty() ? host.trim() : "smtp.gmail.com");
        mailSender.setPort(port > 0 ? port : 587);

        String resolvedUser = (username != null && !username.trim().isEmpty())
                ? username.trim()
                : System.getenv("SPRING_MAIL_USERNAME");

        String resolvedPass = (password != null && !password.trim().isEmpty())
                ? password.trim()
                : System.getenv("SPRING_MAIL_PASSWORD");

        if (resolvedUser != null && !resolvedUser.trim().isEmpty()) {
            mailSender.setUsername(resolvedUser.trim());
        }

        if (resolvedPass != null && !resolvedPass.trim().isEmpty()) {
            // Remove spaces from Google App Password if present (e.g., "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
            String cleanPassword = resolvedPass.replaceAll("\\s+", "").replaceAll("^\"|\"$", "");
            mailSender.setPassword(cleanPassword);
        }

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.ssl.trust", "*");
        props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");
        props.put("mail.debug", "false");

        if (mailSender.getPort() == 465) {
            props.put("mail.smtp.ssl.enable", "true");
            props.put("mail.smtp.socketFactory.port", "465");
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            props.put("mail.smtp.socketFactory.fallback", "false");
        } else {
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
        }

        return mailSender;
    }
}
