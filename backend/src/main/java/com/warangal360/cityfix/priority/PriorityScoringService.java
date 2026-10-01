package com.warangal360.cityfix.priority;

import com.warangal360.cityfix.report.Category;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PriorityScoringService {

    private final WeatherService weatherService;

    // Sensitive locations in Warangal (Schools, Hospitals, Key Hubs)
    public static class SensitiveLocation {
        String name;
        double lat;
        double lng;
        double radiusMeters;

        public SensitiveLocation(String name, double lat, double lng, double radiusMeters) {
            this.name = name;
            this.lat = lat;
            this.lng = lng;
            this.radiusMeters = radiusMeters;
        }
    }

    private static final List<SensitiveLocation> SENSITIVE_LOCATIONS = List.of(
            new SensitiveLocation("MGM Hospital Warangal", 17.9942, 79.5938, 400.0),
            new SensitiveLocation("Kakatiya Medical College (KMC)", 17.9890, 79.5850, 400.0),
            new SensitiveLocation("NIT Warangal Campus", 17.9839, 79.5308, 500.0),
            new SensitiveLocation("CKM Govt Maternity Hospital", 17.9620, 79.6015, 350.0),
            new SensitiveLocation("Warangal District Collectorate", 17.9990, 79.5700, 300.0),
            new SensitiveLocation("St. Gabriel's / Fatima High School Kazipet", 17.9750, 79.5150, 350.0),
            new SensitiveLocation("Kakatiya University Campus", 18.0195, 79.5540, 500.0)
    );

    public PriorityScoringService(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    public int calculateScore(int severity, int reportCount, int daysOpen, boolean isEmergency,
                              Category category, Double lat, Double lng) {
        int score = severity * 20;
        score += Math.min(reportCount, 10) * 3;
        score += daysOpen * 2;

        if (isEmergency || severity == 5) {
            score += 50;
        }

        // Weather Bonus (+15)
        WeatherService.WeatherCondition weather = weatherService.checkCurrentWeather(lat, lng);
        if (weather.isRaining() && (category == Category.WATERLOGGING || category == Category.WATER_LEAKAGE)) {
            score += 15;
        } else if (weather.isStorming() && (category == Category.ELECTRICAL_HAZARD || category == Category.FALLEN_TREE)) {
            score += 15;
        }

        // Sensitive Location Bonus (+15)
        if (lat != null && lng != null && isNearSensitiveLocation(lat, lng)) {
            score += 15;
        }

        return Math.max(0, score);
    }

    public boolean isNearSensitiveLocation(double lat, double lng) {
        for (SensitiveLocation loc : SENSITIVE_LOCATIONS) {
            double distance = calculateDistanceMeters(lat, lng, loc.lat, loc.lng);
            if (distance <= loc.radiusMeters) {
                return true;
            }
        }
        return false;
    }

    public static double calculateDistanceMeters(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000; // Radius of Earth in meters
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
