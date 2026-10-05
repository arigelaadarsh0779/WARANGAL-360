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
import com.warangal360.cityfix.report.ReportRepository;
import com.warangal360.cityfix.sla.SlaEscalationScheduler;
import com.warangal360.cityfix.sla.SlaSetting;
import com.warangal360.cityfix.sla.SlaSettingRepository;
import com.warangal360.cityfix.user.AccountStatus;
import com.warangal360.cityfix.user.Role;
import com.warangal360.cityfix.user.User;
import com.warangal360.cityfix.user.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;
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
    private final JdbcTemplate jdbcTemplate;
    private final ReportRepository reportRepository;

    public AdminController(AnalyticsService analyticsService,
                           UserRepository userRepository,
                           DepartmentRepository departmentRepository,
                           SlaSettingRepository slaSettingRepository,
                           AuditLogRepository auditLogRepository,
                           PasswordEncoder passwordEncoder,
                           AuditService auditService,
                           SlaEscalationScheduler slaEscalationScheduler,
                           JdbcTemplate jdbcTemplate,
                           ReportRepository reportRepository) {
        this.analyticsService = analyticsService;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.slaSettingRepository = slaSettingRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
        this.slaEscalationScheduler = slaEscalationScheduler;
        this.jdbcTemplate = jdbcTemplate;
        this.reportRepository = reportRepository;
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
        String customPassword = (String) body.get("password");
        String tempPassword = (String) body.get("tempPassword");
        
        String finalPassword = (customPassword != null && !customPassword.isBlank()) 
                ? customPassword.trim() 
                : (tempPassword != null && !tempPassword.isBlank() ? tempPassword.trim() : "Warangal@123");

        if (finalPassword.length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters long.");
        }

        Long departmentId = ((Number) body.get("departmentId")).longValue();
        Integer designationLevel = body.containsKey("designationLevel") ? ((Number) body.get("designationLevel")).intValue() : 0;
        String roleStr = designationLevel == 1 ? "ROLE_DEPT_HEAD" : "ROLE_OFFICIAL";
        if (body.containsKey("role")) {
            roleStr = (String) body.get("role");
        }

        String phone = AuthService.normalizePhone(rawPhone);
        if (userRepository.existsByPhone(phone)) {
            throw new BadRequestException("User with phone number " + phone + " already exists.");
        }

        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        boolean mustChangePassword = body.containsKey("mustChangePassword") 
                ? (Boolean) body.get("mustChangePassword") 
                : false;

        User official = new User();
        official.setName(name);
        official.setPhone(phone);
        official.setPassword(passwordEncoder.encode(finalPassword));
        official.setRole(Role.valueOf(roleStr));
        official.setDepartment(dept);
        official.setDesignationLevel(designationLevel);
        official.setMustChangePassword(mustChangePassword);
        official.setAccountStatus(AccountStatus.ACTIVE);
        official.setCreatedAt(LocalDateTime.now());

        User saved = userRepository.save(official);
        auditService.log(admin, "CREATE_OFFICIAL", "Official #" + saved.getId(), "Created " + roleStr + " (L" + designationLevel + ") for " + dept.getName());
        return ResponseEntity.ok(ApiResponse.ok("Official created successfully", saved));
    }

    @DeleteMapping("/officials/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteOfficial(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) {
        User official = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Official not found"));

        if (official.getRole() != Role.ROLE_OFFICIAL && official.getRole() != Role.ROLE_DEPT_HEAD) {
            throw new BadRequestException("Only department officials and heads can be deleted via this endpoint.");
        }

        // Reassign foreign keys to admin before deleting official
        try {
            jdbcTemplate.update("UPDATE audit_log SET actor_id = ? WHERE actor_id = ?", admin.getId(), id);
            jdbcTemplate.update("UPDATE status_updates SET updated_by_id = ? WHERE updated_by_id = ?", admin.getId(), id);
            jdbcTemplate.update("UPDATE escalation_log SET alerted_user_id = ? WHERE alerted_user_id = ?", admin.getId(), id);
            jdbcTemplate.update("UPDATE notices SET author_id = ? WHERE author_id = ?", admin.getId(), id);
        } catch (Exception ignored) {}

        userRepository.delete(official);
        auditService.log(admin, "DELETE_OFFICIAL", "Official #" + id, "Deleted " + official.getName() + " (" + official.getRole() + ")");
        return ResponseEntity.ok(ApiResponse.ok("Official deleted successfully", null));
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

    // Delete any report (including resolved) — Admin-only manual deletion
    @DeleteMapping("/reports/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReport(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) {
        if (!reportRepository.existsById(id)) {
            throw new ResourceNotFoundException("Report not found");
        }
        try {
            jdbcTemplate.update("DELETE FROM notifications WHERE report_id = ?", id);
            jdbcTemplate.update("DELETE FROM escalation_log WHERE report_id = ?", id);
            jdbcTemplate.update("DELETE FROM status_updates WHERE report_id = ?", id);
            jdbcTemplate.update("DELETE FROM report_upvotes WHERE report_id = ?", id);
            jdbcTemplate.update("UPDATE reports SET parent_report_id = NULL WHERE parent_report_id = ?", id);
            reportRepository.deleteById(id);
        } catch (Exception e) {
            throw new BadRequestException("Could not delete report: " + e.getMessage());
        }
        auditService.log(admin, "DELETE_REPORT", "Report #" + id, "Manually deleted by admin");
        return ResponseEntity.ok(ApiResponse.ok("Report deleted successfully", null));
    }

    // Get L0 field officers in a department — for L1 dept heads to see their team
    @GetMapping("/dept-officers/{departmentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEPT_HEAD')")
    public ResponseEntity<ApiResponse<List<User>>> getDeptOfficers(@PathVariable Long departmentId) {
        List<User> officers = userRepository.findByDepartmentIdAndDesignationLevel(departmentId, 0);
        return ResponseEntity.ok(ApiResponse.ok(officers));
    }
}
