package com.warangal360.cityfix.auth;

import com.warangal360.cityfix.common.ApiResponse;
import com.warangal360.cityfix.user.User;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.registerCitizen(request);
        return ResponseEntity.ok(ApiResponse.ok("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(currentUser, request);
        return ResponseEntity.ok(ApiResponse.ok("Password updated successfully", null));
    }

    @PostMapping("/preference/language")
    public ResponseEntity<ApiResponse<Void>> updateLanguage(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, String> payload) {
        String lang = payload.getOrDefault("language", "en");
        authService.updateLanguagePreference(currentUser, lang);
        return ResponseEntity.ok(ApiResponse.ok("Language preference saved", null));
    }
}
