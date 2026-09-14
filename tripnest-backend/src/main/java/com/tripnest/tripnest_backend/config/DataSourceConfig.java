package com.tripnest.tripnest_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {

    @Value("${spring.datasource.url:jdbc:postgresql://localhost:5432/tripnest}")
    private String rawUrl;

    @Value("${spring.datasource.username:postgres}")
    private String rawUsername;

    @Value("${spring.datasource.password:Vivek@1234}")
    private String rawPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        String url = rawUrl != null ? rawUrl.trim() : "";
        String username = rawUsername != null ? rawUsername.trim() : "postgres";
        String password = rawPassword != null ? rawPassword.trim() : "";

        // Check direct environment variables if present
        String envUrl = System.getenv("DATABASE_URL");
        if (envUrl != null && !envUrl.trim().isEmpty()) {
            url = envUrl.trim();
        }

        String envUser = System.getenv("DATABASE_USERNAME");
        if (envUser != null && !envUser.trim().isEmpty()) {
            username = envUser.trim();
        }

        String envPass = System.getenv("DATABASE_PASSWORD");
        if (envPass != null && !envPass.trim().isEmpty()) {
            password = envPass.trim();
        }

        // Convert Render / standard PostgreSQL URI (postgresql:// or postgres://) to JDBC URL (jdbc:postgresql://)
        if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
            try {
                URI uri = new URI(url);
                String userInfo = uri.getUserInfo();
                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    username = parts[0];
                    password = parts[1];
                }
                String host = uri.getHost();
                int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                String path = uri.getPath();
                url = "jdbc:postgresql://" + host + ":" + port + path;
                if (uri.getQuery() != null) {
                    url += "?" + uri.getQuery();
                }
            } catch (Exception e) {
                if (url.startsWith("postgres://")) {
                    url = "jdbc:postgresql://" + url.substring("postgres://".length());
                } else if (url.startsWith("postgresql://")) {
                    url = "jdbc:postgresql://" + url.substring("postgresql://".length());
                }
            }
        } else if (!url.startsWith("jdbc:")) {
            url = "jdbc:postgresql://" + url;
        }

        return DataSourceBuilder.create()
                .driverClassName("org.postgresql.Driver")
                .url(url)
                .username(username)
                .password(password)
                .build();
    }
}
