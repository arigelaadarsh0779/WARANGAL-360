package com.warangal360.cityfix.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.warangal360.cityfix.report.Category;
import com.warangal360.cityfix.verification.ImageVerificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AiAnalysisService {

    @Value("${app.ai.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${app.ai.gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final ImageVerificationService imageVerificationService;
    private final Map<String, AiAnalysisResult> resultCache = new ConcurrentHashMap<>();

    private String visionPromptTemplate;
    private String translationPromptTemplate;

    public AiAnalysisService(ObjectMapper objectMapper, ImageVerificationService imageVerificationService) {
        this.objectMapper = objectMapper;
        this.imageVerificationService = imageVerificationService;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(15000);
        this.restTemplate = new RestTemplate(factory);

        loadPrompts();
    }

    private void loadPrompts() {
        try {
            ClassPathResource visionRes = new ClassPathResource("prompts/vision_analysis.txt");
            if (visionRes.exists()) {
                try (InputStream is = visionRes.getInputStream()) {
                    this.visionPromptTemplate = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                }
            }
            ClassPathResource transRes = new ClassPathResource("prompts/notice_translation.txt");
            if (transRes.exists()) {
                try (InputStream is = transRes.getInputStream()) {
                    this.translationPromptTemplate = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                }
            }
        } catch (Exception e) {
            this.visionPromptTemplate = "Analyze civic issue and return JSON schema.";
            this.translationPromptTemplate = "Translate message to Telugu JSON.";
        }
    }

    public AiAnalysisResult analyzeReport(MultipartFile file, String description, String fileHash) {
        if (fileHash != null && resultCache.containsKey(fileHash)) {
            return resultCache.get(fileHash);
        }

        // 1. Programmatic Image Quality Pre-Check (Reject pitch black, covered lens, blank photos)
        if (file != null && !file.isEmpty()) {
            ImageVerificationService.ImageQualityResult quality = imageVerificationService.evaluateImageQuality(file);
            if (!quality.isValid()) {
                AiAnalysisResult rejected = new AiAnalysisResult();
                rejected.setCivicIssue(false);
                rejected.setRejectionReason(quality.getRejectionReason());
                rejected.setCategory(Category.OTHER);
                rejected.setSeverity(1);
                rejected.setSummaryEn("Rejected: Dark or unreadable image");
                if (fileHash != null) resultCache.put(fileHash, rejected);
                return rejected;
            }
        }

        // 2. Deep AI Vision Analysis via Gemini
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            try {
                AiAnalysisResult result = callGeminiVision(file, description);
                if (result != null) {
                    if (fileHash != null) resultCache.put(fileHash, result);
                    return result;
                }
            } catch (Exception e) {
                // Fail softly and fallback to smart heuristic
            }
        }

        // 3. Smart Heuristic Fallback
        AiAnalysisResult fallback = buildSmartHeuristicResult(description);
        if (fileHash != null) resultCache.put(fileHash, fallback);
        return fallback;
    }

    private AiAnalysisResult callGeminiVision(MultipartFile file, String description) throws Exception {
        String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
        String mimeType = file.getContentType() != null ? file.getContentType() : "image/jpeg";

        String prompt = (visionPromptTemplate != null ? visionPromptTemplate : "") +
                "\n\nCitizen Description: " + (description != null ? description : "None provided");

        Map<String, Object> inlineData = Map.of("mime_type", mimeType, "data", base64Image);
        Map<String, Object> imagePart = Map.of("inline_data", inlineData);
        Map<String, Object> textPart = Map.of("text", prompt);

        Map<String, Object> content = Map.of("parts", List.of(textPart, imagePart));
        Map<String, Object> requestBody = Map.of("contents", List.of(content));

        String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                geminiModel, geminiApiKey);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        String rawResponse = restTemplate.postForObject(url, entity, String.class);
        if (rawResponse != null) {
            JsonNode root = objectMapper.readTree(rawResponse);
            JsonNode candidate = root.path("candidates").get(0);
            String text = candidate.path("content").path("parts").get(0).path("text").asText("");
            return parseAiJsonResponse(text);
        }
        return null;
    }

    public String translateNoticeToTelugu(String messageEn) {
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            try {
                String prompt = (translationPromptTemplate != null ? translationPromptTemplate : "")
                        .replace("${messageEn}", messageEn);

                Map<String, Object> textPart = Map.of("text", prompt);
                Map<String, Object> content = Map.of("parts", List.of(textPart));
                Map<String, Object> requestBody = Map.of("contents", List.of(content));

                String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                        geminiModel, geminiApiKey);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

                String rawResponse = restTemplate.postForObject(url, entity, String.class);
                if (rawResponse != null) {
                    JsonNode root = objectMapper.readTree(rawResponse);
                    String text = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText("");
                    String cleanJson = cleanJsonFence(text);
                    JsonNode parsed = objectMapper.readTree(cleanJson);
                    if (parsed.has("translationTe")) {
                        return parsed.path("translationTe").asText();
                    }
                }
            } catch (Exception e) {
                // Fallback
            }
        }
        return "పౌర ప్రకటన: " + messageEn + " (వరంగల్ మున్సిపల్ కార్పొరేషన్)";
    }

    private AiAnalysisResult parseAiJsonResponse(String text) {
        try {
            String clean = cleanJsonFence(text);
            JsonNode node = objectMapper.readTree(clean);

            AiAnalysisResult res = new AiAnalysisResult();
            res.setCivicIssue(node.path("isCivicIssue").asBoolean(true));
            res.setRejectionReason(node.path("rejectionReason").isNull() ? null : node.path("rejectionReason").asText(null));

            String catStr = node.path("category").asText("OTHER").toUpperCase();
            try {
                res.setCategory(Category.valueOf(catStr));
            } catch (Exception e) {
                res.setCategory(Category.OTHER);
            }

            res.setSeverity(node.path("severity").asInt(3));
            res.setEmergency(node.path("isEmergency").asBoolean(false));
            res.setSummaryEn(node.path("summaryEn").asText("Civic issue in Warangal"));
            res.setDepartment(node.path("department").asText("Sanitation"));
            res.setScreenshotOrInternetImage(node.path("isScreenshotOrInternetImage").asBoolean(false));
            res.setAiCrewEstimate(node.path("aiCrewEstimate").asText("2 field personnel with standard repair kit"));
            return res;
        } catch (Exception e) {
            return null;
        }
    }

    private String cleanJsonFence(String input) {
        if (input == null) return "{}";
        String trimmed = input.trim();
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }
        return trimmed.trim();
    }

    private AiAnalysisResult buildSmartHeuristicResult(String description) {
        AiAnalysisResult res = new AiAnalysisResult();
        String text = (description != null ? description.toLowerCase() : "");

        if (text.contains("garbage") || text.contains("trash") || text.contains("waste") || text.contains("dump") || text.contains("చెత్త")) {
            res.setCategory(Category.GARBAGE);
            res.setDepartment("Sanitation");
            res.setSeverity(3);
            res.setSummaryEn("Uncollected garbage dump causing public sanitation nuisance");
            res.setAiCrewEstimate("3 sanitation workers + 1 compactor vehicle");
        } else if (text.contains("pothole") || text.contains("road") || text.contains("tar") || text.contains("crack") || text.contains("రోడ్డు")) {
            res.setCategory(Category.ROADS);
            res.setDepartment("Roads");
            res.setSeverity(3);
            res.setSummaryEn("Damaged road surface and potholes obstructing vehicle movement");
            res.setAiCrewEstimate("4 road crew members + bitumen patch roller");
        } else if (text.contains("wire") || text.contains("electric") || text.contains("shock") || text.contains("spark") || text.contains("కరెంట్")) {
            res.setCategory(Category.ELECTRICAL_HAZARD);
            res.setDepartment("Electricity");
            res.setSeverity(5);
            res.setEmergency(true);
            res.setSummaryEn("Exposed electrical wire hazard threatening pedestrian safety");
            res.setAiCrewEstimate("2 certified linemen + 1 electrical inspection van");
        } else if (text.contains("light") || text.contains("pole") || text.contains("లైటు")) {
            res.setCategory(Category.STREETLIGHT);
            res.setDepartment("Electricity");
            res.setSeverity(2);
            res.setSummaryEn("Non-functional street light fixture on municipal road");
            res.setAiCrewEstimate("1 electrical technician + hydraulic lift ladder");
        } else if (text.contains("flood") || text.contains("waterlog") || text.contains("drain") || text.contains("నీరు")) {
            res.setCategory(Category.WATERLOGGING);
            res.setDepartment("Disaster Management");
            res.setSeverity(4);
            res.setSummaryEn("Severe storm waterlogging blocking arterial transit route");
            res.setAiCrewEstimate("4 disaster response personnel + high-capacity dewatering pump");
        } else if (text.contains("pipe") || text.contains("leak") || text.contains("tap") || text.contains("మంచినీరు")) {
            res.setCategory(Category.WATER_LEAKAGE);
            res.setDepartment("Water");
            res.setSeverity(3);
            res.setSummaryEn("Municipal water supply pipeline leakage causing wastage");
            res.setAiCrewEstimate("2 water board plumbers + pipe repair clamps");
        } else if (text.contains("tree") || text.contains("branch") || text.contains("చెట్టు")) {
            res.setCategory(Category.FALLEN_TREE);
            res.setDepartment("Disaster Management");
            res.setSeverity(4);
            res.setSummaryEn("Fallen tree branch blocking public passageway");
            res.setAiCrewEstimate("3 emergency crew + chainsaw & transport truck");
        } else {
            // NO civic keyword found — reject if description is also empty/generic
            // This prevents black/random photos with no description from being auto-approved
            if (description == null || description.isBlank() || description.trim().length() < 10) {
                res.setCivicIssue(false);
                res.setRejectionReason("Could not identify a valid civic issue from the photo or description. Please add a clear description of the problem (e.g., 'pothole on main road', 'garbage pile near school').");
                res.setCategory(Category.OTHER);
                res.setSeverity(1);
                res.setSummaryEn("Rejected: No identifiable civic issue");
                res.setAiCrewEstimate("N/A");
            } else {
                res.setCategory(Category.OTHER);
                res.setDepartment("Sanitation");
                res.setSeverity(3);
                res.setSummaryEn(description);
                res.setAiCrewEstimate("2 civic field staff for on-site assessment");
            }
        }
        return res;
    }
}
