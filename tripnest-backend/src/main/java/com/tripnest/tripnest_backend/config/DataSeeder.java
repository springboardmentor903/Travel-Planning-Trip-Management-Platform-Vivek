package com.tripnest.tripnest_backend.config;

import com.tripnest.tripnest_backend.entity.Role;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.RoleRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final List<String> DEFAULT_ROLES = List.of("TRAVELER", "GROUP_ADMIN", "ADMINISTRATOR");
    private static final String DEFAULT_ADMIN_EMAIL = "admin@tripnest.com";
    private static final String DEFAULT_ADMIN_PASSWORD = "admin123456";

    private String getAdminEmail() {
        String envEmail = System.getenv("ADMIN_EMAIL");
        return (envEmail != null && !envEmail.isBlank()) ? envEmail.trim() : DEFAULT_ADMIN_EMAIL;
    }

    private String getAdminPassword() {
        String envPassword = System.getenv("ADMIN_PASSWORD");
        return (envPassword != null && !envPassword.isBlank()) ? envPassword.trim() : DEFAULT_ADMIN_PASSWORD;
    }

    @Override
    public void run(String... args) {
        DEFAULT_ROLES.forEach(roleName -> {
            if (roleRepository.findByName(roleName).isEmpty()) {
                Role role = new Role();
                role.setName(roleName);
                roleRepository.save(role);
            }
        });

        Role adminRole = roleRepository.findByName("ADMINISTRATOR")
                .orElseThrow(() -> new RuntimeException("ADMINISTRATOR role missing after seeding"));

        String adminEmail = getAdminEmail();
        String adminPassword = getAdminPassword();

        User admin = userRepository.findByEmailIgnoreCase(adminEmail).orElse(null);
        if (admin == null) {
            admin = new User();
            admin.setName("Default Administrator");
            admin.setEmail(adminEmail);
            admin.setOauthGoogle(false);
            log.info("[DataSeeder] Creating default administrator account: {}", adminEmail);
        } else {
            log.info("[DataSeeder] Synchronizing administrator credentials for existing account: {}", adminEmail);
        }

        admin.setRole(adminRole);
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        userRepository.save(admin);
    }
}
