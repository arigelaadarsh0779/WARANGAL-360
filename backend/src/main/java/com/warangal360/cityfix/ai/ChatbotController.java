package com.warangal360.cityfix.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    @Value("${app.ai.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${app.ai.gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    private static final String SYSTEM_CONTEXT = """
        You are NAGA, the official AI assistant for WARANGAL 360 — a civic grievance reporting and public accountability platform for Greater Warangal Municipal Corporation (GWMC), Telangana, India.

        Your purpose:
        - Help citizens understand how to report civic issues (potholes, garbage, water leaks, streetlights, electrical hazards, waterlogging, fallen trees).
        - Guide users on how to track complaint status and use the WARANGAL 360 app.
        - Explain the AI-driven priority scoring, SLA escalation, and department routing system.
        - Provide emergency helpline information for Warangal.
        - Answer questions about Warangal city, GWMC, and civic services.
        - If asked about non-civic topics, politely redirect to civic matters.
        - Respond in the same language as the user (English or Telugu).
        - Keep answers concise, friendly, and actionable. Use emojis where helpful.
        - Never make up specific case IDs, officer names, or real-time data.
        - Emergency contacts: Police 100, Ambulance 108, Fire 101, GWMC 1800-425-1980, TSNPDCL 1912.
        """;

    public ChatbotController(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(20000);
        this.restTemplate = new RestTemplate(factory);
    }

    @PostMapping("/message")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, Object> body) {
        String userMessage = (String) body.get("message");
        if (userMessage == null || userMessage.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Empty message"));
        }

        String reply = generateReply(userMessage);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of("reply", reply)
        ));
    }

    private String generateReply(String userMessage) {
        if (geminiApiKey != null && !geminiApiKey.isBlank() && !geminiApiKey.contains("YOUR_GEMINI")) {
            try {
                String fullPrompt = SYSTEM_CONTEXT + "\n\nUser: " + userMessage + "\n\nNAGA:";

                Map<String, Object> textPart = Map.of("text", fullPrompt);
                Map<String, Object> content = Map.of("parts", List.of(textPart));
                Map<String, Object> requestBody = Map.of(
                        "contents", List.of(content),
                        "generationConfig", Map.of(
                                "temperature", 0.7,
                                "maxOutputTokens", 512
                        )
                );

                String url = String.format(
                        "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                        geminiModel, geminiApiKey);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

                String rawResponse = restTemplate.postForObject(url, entity, String.class);
                if (rawResponse != null) {
                    JsonNode root = objectMapper.readTree(rawResponse);
                    String text = root.path("candidates").get(0)
                            .path("content").path("parts").get(0).path("text").asText("");
                    if (!text.isBlank()) return text.trim();
                }
            } catch (Exception e) {
                // Fall through to smart fallback
            }
        }
        return buildFallbackReply(userMessage);
    }

    private String buildFallbackReply(String message) {
        String lower = message.toLowerCase();
        if (lower.contains("report") || lower.contains("submit") || lower.contains("complaint")) {
            return "📸 To report a civic issue:\n1. Tap **Report Issue** on the home screen.\n2. Allow camera & location access.\n3. Capture a live photo — our AI will auto-classify the issue!\n4. Add a short description and submit.\n\nYour complaint will be routed to the correct department automatically! 🏛️";
        } else if (lower.contains("track") || lower.contains("status") || lower.contains("my report")) {
            return "🔍 To track your complaint:\n- Go to **My Reports** from the menu.\n- Each report shows live status: Submitted → Acknowledged → In Progress → Resolved.\n- You'll get notifications when officials update your report!";
        } else if (lower.contains("police") || lower.contains("100")) {
            return "🚔 Warangal Police Emergency: **100**\nWarangal City Police Control Room: **0870-2421111**\nFor online FIR: Visit your nearest police station or call 100.";
        } else if (lower.contains("ambulance") || lower.contains("hospital") || lower.contains("108")) {
            return "🚑 Emergency Ambulance: **108** (Free, 24x7)\nMGM Government Hospital, Warangal: **0870-2441234**";
        } else if (lower.contains("fire") || lower.contains("101")) {
            return "🔥 Fire & Rescue Services: **101**\nWarangal Fire Station: **0870-2421337**";
        } else if (lower.contains("water") || lower.contains("pipe") || lower.contains("leak")) {
            return "💧 For water supply issues:\n- Report via the app → our AI routes it to **Water Department** automatically.\n- Emergency: Mission Bhagiratha Water Board: **0870-2456789**\n- GWMC Helpline: **1800-425-1980** (Toll-free)";
        } else if (lower.contains("electric") || lower.contains("light") || lower.contains("power")) {
            return "⚡ For electricity issues:\n- Streetlight failures and wire hazards → Report via app, auto-routed to Electricity Dept.\n- TSNPDCL Emergency: **1912** (24x7)\n- Live wire on road = Emergency! Call **1912** immediately!";
        } else if (lower.contains("garbage") || lower.contains("waste") || lower.contains("clean")) {
            return "🗑️ For garbage & sanitation:\n- Report via the app — captured photo is AI-verified and sent to **Sanitation Department**.\n- GWMC Toll-Free: **1800-425-1980**\n- Warangal has daily sweeping routes — if your area is missed, report it! 🌿";
        } else if (lower.contains("priority") || lower.contains("score") || lower.contains("urgent")) {
            return "📊 Our **Dynamic Priority Engine** automatically scores issues based on:\n- 🔴 Severity (1–5, rated by AI)\n- 👥 Number of affected citizens reporting the same issue\n- ⏰ How long the issue has been open\n- 🌧️ Live weather conditions (rain boosts score!)\n- 🏫 Proximity to sensitive locations (hospitals, schools)\n\nHigher score = Faster response!";
        } else if (lower.contains("hello") || lower.contains("hi") || lower.contains("నమస్కారం") || lower.contains("హలో")) {
            return "👋 నమస్కారం! I'm **NAGA**, your WARANGAL 360 AI assistant!\n\nI can help you:\n📸 Report civic issues (potholes, garbage, leaks)\n🔍 Track your complaint status\n📞 Get emergency helpline numbers\n🏛️ Understand how GWMC works\n\nHow can I assist you today?";
        } else if (lower.contains("telugu") || lower.contains("language") || lower.contains("తెలుగు")) {
            return "🌐 WARANGAL 360 పూర్తి **తెలుగు** మద్దతు అందిస్తోంది!\n\nHome screen పై **EN / తె** button ను tap చేసి భాష మార్చుకోండి.\nమీ రిపోర్ట్ summary కూడా AI ద్వారా తెలుగులో అందుబాటులో ఉంటుంది! 🙏";
        } else {
            return "🤔 I'm not sure I understood that. As **NAGA**, I specialize in Warangal civic issues!\n\nYou can ask me:\n• How to **report** a pothole, garbage, water leak, etc.\n• How to **track** your complaint\n• **Emergency** contact numbers\n• How the **AI priority system** works\n\nWhat would you like to know? 😊";
        }
    }
}
