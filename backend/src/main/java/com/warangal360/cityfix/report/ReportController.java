package com.warangal360.cityfix.report;

import com.warangal360.cityfix.common.ApiResponse;
import com.warangal360.cityfix.user.User;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;
    private final ReportRepository reportRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public ReportController(ReportService reportService, ReportRepository reportRepository, org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.reportService = reportService;
        this.reportRepository = reportRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ReportSubmissionResult>> submitReport(
            @AuthenticationPrincipal User currentUser,
            @RequestParam("photo") MultipartFile photo,
            @RequestParam("latitude") Double latitude,
            @RequestParam("longitude") Double longitude,
            @RequestParam(value = "accuracy", required = false) Double accuracy,
            @RequestParam(value = "description", required = false) String description) {

        ReportSubmissionResult result = reportService.submitReport(
                currentUser, photo, latitude, longitude, accuracy, description);

        return ResponseEntity.ok(ApiResponse.ok("Submission processed", result));
    }

    @GetMapping("/my-reports")
    public ResponseEntity<ApiResponse<List<Report>>> getMyReports(@AuthenticationPrincipal User currentUser) {
        List<Report> reports = reportService.getUserReports(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(reports));
    }

    @GetMapping("/public-map")
    public ResponseEntity<ApiResponse<List<Report>>> getPublicMap() {
        List<Report> reports = reportService.getPublicMapReports();
        return ResponseEntity.ok(ApiResponse.ok(reports));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Report>> getReportDetail(@PathVariable Long id) {
        Report report = reportService.getReportDetail(id);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/{id}/public")
    public ResponseEntity<ApiResponse<Report>> getPublicReportDetail(@PathVariable Long id) {
        Report report = reportService.getReportDetail(id);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<StatusUpdate>>> getReportHistory(@PathVariable Long id) {
        List<StatusUpdate> history = reportService.getReportHistory(id);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }

    @PostMapping(value = "/{id}/status", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OFFICIAL', 'DEPT_HEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<Report>> updateStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal User official,
            @RequestParam("status") ReportStatus status,
            @RequestParam(value = "comment", required = false) String comment,
            @RequestParam(value = "pauseReason", required = false) String pauseReason,
            @RequestParam(value = "afterPhoto", required = false) MultipartFile afterPhoto) {

        StatusUpdateRequest request = new StatusUpdateRequest();
        request.setStatus(status);
        request.setComment(comment);
        request.setPauseReason(pauseReason);

        Report updated = reportService.updateStatus(id, official, request, afterPhoto);
        return ResponseEntity.ok(ApiResponse.ok("Status updated successfully", updated));
    }

    @PostMapping("/{id}/reopen")
    public ResponseEntity<ApiResponse<Void>> reopenReport(
            @PathVariable Long id,
            @AuthenticationPrincipal User citizen,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : "Issue still persists";
        reportService.reopenReport(id, citizen, reason);
        return ResponseEntity.ok(ApiResponse.ok("Report reopened for department action", null));
    }

    @PostMapping("/{id}/upvote")
    public ResponseEntity<ApiResponse<Map<String, Object>>> upvoteReport(
            @PathVariable Long id,
            @AuthenticationPrincipal User citizen) {
        boolean upvoted = reportService.toggleUpvote(id, citizen);
        Report report = reportService.getReportDetail(id);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("upvoted", upvoted, "upvotes", report.getUpvotes())));
    }

    @GetMapping("/department/{departmentId}")
    @PreAuthorize("hasAnyRole('OFFICIAL', 'DEPT_HEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<Report>>> getDepartmentReports(@PathVariable Long departmentId) {
        List<Report> reports = reportService.getDepartmentReports(departmentId);
        return ResponseEntity.ok(ApiResponse.ok(reports));
    }

    @GetMapping("/escalated")
    @PreAuthorize("hasAnyRole('DEPT_HEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<Report>>> getEscalatedReports(@AuthenticationPrincipal User user) {
        Long deptId = user.getDepartment() != null ? user.getDepartment().getId() : null;
        List<Report> list = (deptId != null && user.getRole() == com.warangal360.cityfix.user.Role.ROLE_DEPT_HEAD)
                ? reportRepository.findEscalatedToDeptHead(deptId)
                : reportRepository.findCriticallyOverdueReports();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/critically-overdue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Report>>> getCriticallyOverdue() {
        List<Report> list = reportRepository.findCriticallyOverdueReports();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    // Allow citizen to delete their own report
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMyReport(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new com.warangal360.cityfix.common.ResourceNotFoundException("Report not found"));

        // Check ownership — only the user who submitted OR an admin can delete
        boolean isOwner = report.getUser() != null && report.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == com.warangal360.cityfix.user.Role.ROLE_ADMIN;

        if (!isOwner && !isAdmin) {
            throw new com.warangal360.cityfix.common.BadRequestException("You can only delete your own reports.");
        }

        try {
            jdbcTemplate.update("DELETE FROM notifications WHERE report_id = ?", id);
            jdbcTemplate.update("DELETE FROM escalation_log WHERE report_id = ?", id);
            jdbcTemplate.update("DELETE FROM status_updates WHERE report_id = ?", id);
            jdbcTemplate.update("DELETE FROM report_upvotes WHERE report_id = ?", id);
            jdbcTemplate.update("UPDATE reports SET parent_report_id = NULL WHERE parent_report_id = ?", id);
            reportRepository.deleteById(id);
        } catch (Exception e) {
            throw new com.warangal360.cityfix.common.BadRequestException("Could not delete report: " + e.getMessage());
        }

        return ResponseEntity.ok(ApiResponse.ok("Report deleted successfully", null));
    }
}
