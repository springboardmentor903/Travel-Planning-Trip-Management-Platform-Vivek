package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.AuthResponse;
import com.tripnest.tripnest_backend.dto.LoginRequest;
import com.tripnest.tripnest_backend.dto.RegisterRequest;
import com.tripnest.tripnest_backend.entity.Role;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.RoleRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import com.tripnest.tripnest_backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    private static final String DEFAULT_ROLE = "TRAVELER";

    public AuthResponse registerUser(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered: " + request.getEmail());
        }

        Role defaultRole = roleRepository.findByName(DEFAULT_ROLE)
                .orElseThrow(() -> new RuntimeException(
                        "Default role not found. Make sure roles are seeded."));

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(defaultRole);
        user.setOauthGoogle(false);

        User savedUser = userRepository.save(user);

        String roleName = savedUser.getRole() != null ? savedUser.getRole().getName() : "TRAVELER";
        return new AuthResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                "User registered successfully",
                null,
                roleName
        );
    }

    public AuthResponse loginUser(LoginRequest request) {

        String email = request.getEmail() != null ? request.getEmail().trim() : "";
        User user = userRepository.findByEmailIgnoreCase(email)
                .or(() -> userRepository.findByEmail(email))
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getEmail());

        // Send login notification email fail-safely
        try {
            emailService.sendLoginNotificationEmail(user, LocalDateTime.now());
        } catch (Exception e) {
            log.warn("Failed to send login notification email to {}: {}", user.getEmail(), e.getMessage());
        }

        String roleName = user.getRole() != null ? user.getRole().getName() : "TRAVELER";
        return new AuthResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                "Login successful",
                token,
                roleName
        );
    }
}
