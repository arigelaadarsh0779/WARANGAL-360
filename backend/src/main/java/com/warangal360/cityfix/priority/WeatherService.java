package com.warangal360.cityfix.priority;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Set;

@Service
public class WeatherService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final Set<Integer> RAIN_CODES = Set.of(51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82);
    private static final Set<Integer> STORM_CODES = Set.of(95, 96, 99);

    public WeatherService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(2000);
        factory.setReadTimeout(2000);
        this.restTemplate = new RestTemplate(factory);
    }

    public WeatherCondition checkCurrentWeather(Double lat, Double lng) {
        if (lat == null || lng == null) {
            lat = 17.9689; // Warangal default
            lng = 79.5941;
        }

        try {
            String url = String.format("https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current_weather=true", lat, lng);
            String response = restTemplate.getForObject(url, String.class);
            if (response != null) {
                JsonNode root = objectMapper.readTree(response);
                JsonNode currentWeather = root.path("current_weather");
                if (!currentWeather.isMissingNode()) {
                    int weatherCode = currentWeather.path("weathercode").asInt(0);
                    double temperature = currentWeather.path("temperature").asDouble(30.0);
                    double windSpeed = currentWeather.path("windspeed").asDouble(5.0);

                    boolean isRaining = RAIN_CODES.contains(weatherCode);
                    boolean isStorming = STORM_CODES.contains(weatherCode) || windSpeed > 40.0;

                    return new WeatherCondition(weatherCode, temperature, isRaining, isStorming);
                }
            }
        } catch (Exception e) {
            // Soft fail: return calm weather
        }
        return new WeatherCondition(0, 30.0, false, false);
    }

    public static class WeatherCondition {
        private final int weatherCode;
        private final double temperature;
        private final boolean isRaining;
        private final boolean isStorming;

        public WeatherCondition(int weatherCode, double temperature, boolean isRaining, boolean isStorming) {
            this.weatherCode = weatherCode;
            this.temperature = temperature;
            this.isRaining = isRaining;
            this.isStorming = isStorming;
        }

        public int getWeatherCode() { return weatherCode; }
        public double getTemperature() { return temperature; }
        public boolean isRaining() { return isRaining; }
        public boolean isStorming() { return isStorming; }
    }
}
