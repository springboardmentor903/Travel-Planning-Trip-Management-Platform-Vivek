package com.tripnest.tripnest_backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
public class WeatherService {

    private final RestTemplate restTemplate;

    @Value("${weather.api.key}")
    private String apiKey;

    @Value("${weather.api.url}")
    private String apiUrl;

    public WeatherService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String getWeather(String city) {
        String resolved = resolveCity(city);
        try {
            String url = apiUrl
                    + "?q=" + resolved
                    + "&appid=" + apiKey
                    + "&units=metric";
            return restTemplate.getForObject(url, String.class);
        } catch (HttpClientErrorException.NotFound ex) {
            log.warn("City not found for query '{}' (resolved to '{}'). Trying secondary fallbacks...", city, resolved);
            if (city != null && city.contains(",")) {
                String[] parts = city.split(",");
                for (String part : parts) {
                    String trimmed = part.trim();
                    if (!trimmed.isEmpty() && !trimmed.equalsIgnoreCase(resolved)) {
                        try {
                            String fallbackUrl = apiUrl
                                    + "?q=" + trimmed
                                    + "&appid=" + apiKey
                                    + "&units=metric";
                            return restTemplate.getForObject(fallbackUrl, String.class);
                        } catch (Exception ignored) {}
                    }
                }
            }
            throw ex;
        }
    }

    /**
     * Resolves landmarks, temples, and destination variants to valid OpenWeatherMap city/location queries.
     */
    public String resolveCity(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            return "Delhi";
        }
        String lower = raw.trim().toLowerCase();

        // 1. Specific landmark & pilgrimage mappings
        if (lower.contains("somnath") || lower.contains("prabhas patan")) {
            return "Veraval,IN"; // Veraval is the municipal weather station and twin city for Somnath Temple
        }
        if (lower.contains("panchmarhi") || lower.contains("pachmarhi") || lower.contains("satpura")) {
            return "Pachmarhi,IN";
        }
        if (lower.contains("taj mahal")) {
            return "Agra,IN";
        }
        if (lower.contains("golden temple")) {
            return "Amritsar,IN";
        }
        if (lower.contains("hawa mahal") || lower.contains("amer fort") || lower.contains("pink city")) {
            return "Jaipur,IN";
        }
        if (lower.contains("india gate") || lower.contains("red fort") || lower.contains("qutub minar")) {
            return "New Delhi,IN";
        }
        if (lower.contains("gateway of india") || lower.contains("marine drive") || lower.contains("elephanta")) {
            return "Mumbai,IN";
        }
        if (lower.contains("eiffel tower") || lower.contains("louvre")) {
            return "Paris,FR";
        }
        if (lower.contains("big ben") || lower.contains("tower bridge") || lower.contains("london eye")) {
            return "London,GB";
        }
        if (lower.contains("statue of liberty") || lower.contains("times square") || lower.contains("central park")) {
            return "New York,US";
        }
        if (lower.contains("victoria memorial") || lower.contains("howrah bridge")) {
            return "Kolkata,IN";
        }
        if (lower.contains("charminar") || lower.contains("golconda")) {
            return "Hyderabad,IN";
        }
        if (lower.contains("kedarnath")) {
            return "Rudraprayag,IN";
        }
        if (lower.contains("badrinath")) {
            return "Chamoli,IN";
        }
        if (lower.contains("vaishno devi")) {
            return "Katra,IN";
        }
        if (lower.contains("meenakshi")) {
            return "Madurai,IN";
        }
        if (lower.contains("dal lake")) {
            return "Srinagar,IN";
        }
        if (lower.contains("pangong") || lower.contains("nubra")) {
            return "Leh,IN";
        }

        // If raw contains commas like "Shree Somnath Temple, Gujarat, India", check the first token
        if (raw.contains(",")) {
            String firstToken = raw.split(",")[0].trim();
            if (!firstToken.isEmpty()) {
                // re-check first token
                String firstLower = firstToken.toLowerCase();
                if (firstLower.contains("somnath")) return "Veraval,IN";
                if (firstLower.contains("panchmarhi") || firstLower.contains("pachmarhi")) return "Pachmarhi,IN";
                return firstToken;
            }
        }

        return raw.trim();
    }
}