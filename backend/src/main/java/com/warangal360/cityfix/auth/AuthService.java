package com.warangal360.cityfix.auth;

import com.warangal360.cityfix.common.BadRequestException;
import com.warangal360.cityfix.common.ResourceNotFoundException;
import com.warangal360.cityfix.config.JwtTokenProvider;
import com.warangal360.cityfix.user.AccountStatus;
import com.warangal360.cityfix.user.Role;
import com.warangal360.cityfix.user.User;
import com.warangal360.cityfix.user.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    public static String normalizePhone(String rawPhone) {
        if (rawPhone == null) return null;
        String clean = rawPhone.replaceAll("[^0-9+]", "");
        if (!clean.startsWith("+91")) {
            if (clean.startsWith("91") && clean.length() == 12) {
                clean = "+" + clean;
            } else if (clean.length() == 10) {
                clean = "+91" + clean;
            }
        }
        return clean;
    }

    @Transactional
    public AuthResponse registerCitizen(RegisterRequest request) {
        String normalizedPhone = normalizePhone(request.getPhone());

        if (userRepository.existsByPhone(normalizedPhone)) {
            throw new BadRequestException("An account with this phone number already exists.");
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setPhone(normalizedPhone);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.ROLE_CITIZEN);
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setPreferredLanguage(request.getPreferredLanguage() != null ? request.getPreferredLanguage() : "en");
        user.setCreatedAt(LocalDateTime.now());
        user.setLastLogin(LocalDateTime.now());

        User saved = userRepository.save(user);
        String token = tokenProvider.generateToken(saved);

        return new AuthResponse(
                token,
                saved.getId(),
                saved.getName(),
                saved.getPhone(),
                saved.getRole(),
                null,
                null,
                saved.getDesignationLevel(),
                saved.getMustChangePassword(),
                saved.getPreferredLanguage()
        );
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String normalizedPhone = normalizePhone(request.getPhone());

        User user = userRepository.findByPhone(normalizedPhone)
                .orElseThrow(() -> new BadCredentialsException("Invalid phone number or password."));

        if (user.getAccountStatus() == AccountStatus.SUSPENDED) {
            throw new BadRequestException("Your account has been suspended due to repeated policy violations. Please contact the administrator.");
        }

        if (user.getAccountStatus() == AccountStatus.INACTIVE) {
            throw new BadRequestException("This account is inactive.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid phone number or password.");
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String token = tokenProvider.generateToken(user);
        String departmentName = user.getDepartment() != null ? user.getDepartment().getName() : null;
        Long departmentId = user.getDepartment() != null ? user.getDepartment().getId() : null;

        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getPhone(),
                user.getRole(),
                departmentId,
                departmentName,
                user.getDesignationLevel(),
                user.getMustChangePassword(),
                user.getPreferredLanguage()
        );
    }

    @Transactional
    public void changePassword(User currentUser, ChangePasswordRequest request) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new BadRequestException("Current password does not match.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        userRepository.save(user);
    }

    @Transactional
    public void updateLanguagePreference(User currentUser, String language) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setPreferredLanguage("te".equalsIgnoreCase(language) ? "te" : "en");
        userRepository.save(user);
    }
}
