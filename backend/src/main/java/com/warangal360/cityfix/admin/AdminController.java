package com.warangal360.cityfix.admin;

import com.warangal360.cityfix.analytics.AnalyticsService;
import com.warangal360.cityfix.audit.AuditLog;
import com.warangal360.cityfix.audit.AuditLogRepository;
import com.warangal360.cityfix.audit.AuditService;
import com.warangal360.cityfix.auth.AuthService;
import com.warangal360.cityfix.common.ApiResponse;
import com.warangal360.cityfix.common.BadRequestException;
import com.warangal360.cityfix.common.ResourceNotFoundException;
import com.warangal360.cityfix.department.Department;
import com.warangal360.cityfix.department.DepartmentRepository;
import com.warangal360.cityfix.sla.SlaEscalationScheduler;
import com.warangal360.cityfix.sla.SlaSetting;
import com.warangal360.cityfix.sla.SlaSettingRepository;
import com.warangal360.cityfix.user.AccountStatus;
import com.warangal360.cityfix.user.Role;
import com.warangal360.cityfix.user.User;
import com.warangal360.cityfix.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final SlaSettingRepository slaSettingRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final SlaEscalationScheduler slaEscalationScheduler;

    public AdminController(AnalyticsService analyticsService,
                           UserRepository userRepository,
                           DepartmentRepository departmentRepository,
                           SlaSettingRepository slaSettingRepository,
                           AuditLogRepository auditLogRepository,
                           PasswordEncoder passwordEncoder,
                           AuditService auditService,
                           SlaEscalationScheduler slaEscalationScheduler) {
        this.analyticsService = analyticsService;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.slaSettingRepository = slaSettingRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
        this.slaEscalationScheduler = slaEscalationScheduler;
    }

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnalytics() {
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getAdminAnalytics()));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.ok(userRepository.findAll()));
    }

    @PostMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<User>> updateUserStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User admin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String statusStr = body.get("status");
        AccountStatus newStatus = AccountStatus.valueOf(statusStr.toUpperCase());
        user.setAccountStatus(newStatus);
        if (newStatus == AccountStatus.ACTIVE) {
            user.setRejectedCount(0); // Reset on unban
        }

        User saved = userRepository.save(user);
        auditService.log(admin, "CHANGE_USER_STATUS", "User #" + user.getId(), "Set status to " + newStatus);
        return ResponseEntity.ok(ApiResponse.ok("User status updated", saved));
    }

    @PostMapping("/officials")
    public ResponseEntity<ApiResponse<User>> createOfficial(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User admin) {

        String name = (String) body.get("name");
        String rawPhone = (String) body.get("phone");
        String tempPassword = (String) body.getOrDefault("tempPassword", "Warangal@123");
        Long departmentId = ((Number) body.get("departmentId")).longValue();
        Integer designationLevel = body.containsKey("designationLevel") ? ((Number) body.get("designationLevel")).intValue() : 0;
        String roleStr = (String) body.getOrDefault("role", designationLevel == 1 ? "ROLE_DEPT_HEAD" : "ROLE_OFFICIAL");

        String phone = AuthService.normalizePhone(rawPhone);
        if (userRepository.existsByPhone(phone)) {
            throw new BadRequestException("User with this phone number already exists.");
        }

        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        User official = new User();
        official.setName(name);
        official.setPhone(phone);
        official.setPassword(passwordEncoder.encode(tempPassword));
        official.setRole(Role.valueOf(roleStr));
        official.setDepartment(dept);
        official.setDesignationLevel(designationLevel);
        official.setMustChangePassword(true); // Mandatory password change at first login
        official.setAccountStatus(AccountStatus.ACTIVE);
        official.setCreatedAt(LocalDateTime.now());

        User saved = userRepository.save(official);
        auditService.log(admin, "CREATE_OFFICIAL", "Official #" + saved.getId(), "Created " + roleStr + " for " + dept.getName());
        return ResponseEntity.ok(ApiResponse.ok("Official created successfully", saved));
    }

    @GetMapping("/sla-settings")
    public ResponseEntity<ApiResponse<List<SlaSetting>>> getSlaSettings() {
        return ResponseEntity.ok(ApiResponse.ok(slaSettingRepository.findAll()));
    }

    @PutMapping("/sla-settings/{id}")
    public ResponseEntity<ApiResponse<SlaSetting>> updateSlaSetting(
            @PathVariable Long id,
            @RequestBody SlaSetting updated,
            @AuthenticationPrincipal User admin) {
        SlaSetting setting = slaSettingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SLA setting not found"));

        setting.setResponseHours(updated.getResponseHours());
        setting.setResolutionHours(updated.getResolutionHours());
        SlaSetting saved = slaSettingRepository.save(setting);

        auditService.log(admin, "UPDATE_SLA_SETTING", "Category " + setting.getCategory(),
                "Response: " + setting.getResponseHours() + "h, Resolution: " + setting.getResolutionHours() + "h");
        return ResponseEntity.ok(ApiResponse.ok("SLA target updated", saved));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAuditLogs() {
        return ResponseEntity.ok(ApiResponse.ok(auditLogRepository.findAllByOrderByCreatedAtDesc()));
    }

    @PostMapping("/demo/trigger-sla")
    public ResponseEntity<ApiResponse<String>> triggerSlaCheck() {
        slaEscalationScheduler.runSlaChecker();
        return ResponseEntity.ok(ApiResponse.ok("SLA checker executed successfully", "OK"));
    }
}
