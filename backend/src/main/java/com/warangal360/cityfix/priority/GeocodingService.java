package com.warangal360.cityfix.priority;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class GeocodingService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeocodingService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(2500);
        factory.setReadTimeout(2500);
        this.restTemplate = new RestTemplate(factory);
    }

    public String reverseGeocode(Double lat, Double lng) {
        if (lat == null || lng == null) {
            return "Warangal, Telangana, India";
        }

        try {
            String url = String.format("https://nominatim.openstreetmap.org/reverse?format=json&lat=%.6f&lon=%.6f&zoom=18&addressdetails=1", lat, lng);
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Warangal360-CivicPlatform/1.0 (contact@warangal360.telangana.gov.in)");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                String displayName = root.path("display_name").asText(null);
                if (displayName != null && !displayName.isBlank()) {
                    return displayName;
                }
            }
        } catch (Exception e) {
            // Soft fallback
        }
        return String.format("Location near (%.4f, %.4f), Warangal, Telangana", lat, lng);
    }
}
