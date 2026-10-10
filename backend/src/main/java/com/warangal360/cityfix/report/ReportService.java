package com.warangal360.cityfix.report;

import com.warangal360.cityfix.ai.AiAnalysisResult;
import com.warangal360.cityfix.ai.AiAnalysisService;
import com.warangal360.cityfix.audit.AuditService;
import com.warangal360.cityfix.common.BadRequestException;
import com.warangal360.cityfix.common.ResourceNotFoundException;
import com.warangal360.cityfix.department.Department;
import com.warangal360.cityfix.department.DepartmentRepository;
import com.warangal360.cityfix.notification.NotificationService;
import com.warangal360.cityfix.priority.GeocodingService;
import com.warangal360.cityfix.priority.PriorityScoringService;
import com.warangal360.cityfix.sla.SlaService;
import com.warangal360.cityfix.user.AccountStatus;
import com.warangal360.cityfix.user.Role;
import com.warangal360.cityfix.user.User;
import com.warangal360.cityfix.user.UserRepository;
import com.warangal360.cityfix.verification.ImageVerificationService;
import com.warangal360.cityfix.verification.StorageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final StatusUpdateRepository statusUpdateRepository;
    private final ReportUpvoteRepository reportUpvoteRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final ImageVerificationService imageVerificationService;
    private final AiAnalysisService aiAnalysisService;
    private final PriorityScoringService priorityScoringService;
    private final GeocodingService geocodingService;
    private final SlaService slaService;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public ReportService(ReportRepository reportRepository,
                         StatusUpdateRepository statusUpdateRepository,
                         ReportUpvoteRepository reportUpvoteRepository,
                         DepartmentRepository departmentRepository,
                         UserRepository userRepository,
                         StorageService storageService,
                         ImageVerificationService imageVerificationService,
                         AiAnalysisService aiAnalysisService,
                         PriorityScoringService priorityScoringService,
                         GeocodingService geocodingService,
                         SlaService slaService,
                         NotificationService notificationService,
                         AuditService auditService) {
        this.reportRepository = reportRepository;
        this.statusUpdateRepository = statusUpdateRepository;
        this.reportUpvoteRepository = reportUpvoteRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
        this.imageVerificationService = imageVerificationService;
        this.aiAnalysisService = aiAnalysisService;
        this.priorityScoringService = priorityScoringService;
        this.geocodingService = geocodingService;
        this.slaService = slaService;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional
    public ReportSubmissionResult submitReport(User currentUser, MultipartFile photo,
                                               Double latitude, Double longitude, Double accuracy,
                                               String description) {
        // 1. Validate user account status
        if (currentUser.getAccountStatus() == AccountStatus.SUSPENDED) {
            throw new BadRequestException("Account suspended due to repeated invalid submissions.");
        }

        // 2. Validate daily limit (~5 reports/day)
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long todayCount = reportRepository.countUserReportsToday(currentUser.getId(), startOfDay);
        if (todayCount >= 5) {
            throw new BadRequestException("Daily limit reached (maximum 5 reports per day). Please try again tomorrow.");
        }

        // 3. Location & accuracy check (gracefully handle weak GPS and indoors)
        if (latitude == null || longitude == null) {
            latitude = 17.9689; // Warangal Center default fallback
            longitude = 79.5941;
            accuracy = 50.0;
        }
        if (accuracy == null) {
            accuracy = 30.0;
        }
        // Cap excessive accuracy display for reliability
        if (accuracy > 500.0) {
            accuracy = 500.0;
        }

        if (photo == null || photo.isEmpty()) {
            throw new BadRequestException("A live captured photo is mandatory.");
        }

        // 4. Compute file hash & perceptual hash
        String sha256 = imageVerificationService.computeSha256(photo);
        String dHash = imageVerificationService.computeDHash(photo);

        // Check exact duplicate file hash
        Optional<Report> existingByHash = reportRepository.findByFileHash(sha256);
        if (existingByHash.isPresent()) {
            Report original = existingByHash.get();
            original.setReportCount(original.getReportCount() + 1);
            int newScore = priorityScoringService.calculateScore(
                    original.getAiSeverity(), original.getReportCount(), 0,
                    original.getIsEmergency(), original.getCategory(), original.getLatitude(), original.getLongitude());
            original.setPriorityScore(newScore);
            reportRepository.save(original);

            return ReportSubmissionResult.duplicate(original, original);
        }

        // 5. Store image file
        String photoUrl = storageService.store(photo);

        // 6. AI Analysis
        AiAnalysisResult aiResult = aiAnalysisService.analyzeReport(photo, description, sha256);

        // Check if rejected by AI (not a civic issue)
        if (!aiResult.isCivicIssue()) {
            currentUser.setRejectedCount(currentUser.getRejectedCount() + 1);
            if (currentUser.getRejectedCount() >= 5) {
                currentUser.setAccountStatus(AccountStatus.SUSPENDED);
            }
            userRepository.save(currentUser);

            String reason = aiResult.getRejectionReason() != null ? aiResult.getRejectionReason() : "Image does not appear to show a valid civic issue.";
            return ReportSubmissionResult.rejected(reason);
        }

        // 7. Check spatial proximity for candidate duplicates (~75m)
        double deltaLat = 75.0 / 111320.0;
        double deltaLng = 75.0 / (111320.0 * Math.cos(Math.toRadians(latitude)));

        List<Report> nearbyOpen = reportRepository.findOpenCandidateDuplicates(
                aiResult.getCategory(),
                latitude - deltaLat, latitude + deltaLat,
                longitude - deltaLng, longitude + deltaLng
        );

        for (Report openCandidate : nearbyOpen) {
            double dist = PriorityScoringService.calculateDistanceMeters(latitude, longitude, openCandidate.getLatitude(), openCandidate.getLongitude());
            if (dist <= 75.0) {
                // Link as child duplicate
                Report child = new Report();
                child.setUser(currentUser);
                child.setDescription(description);
                child.setPhotoUrl(photoUrl);
                child.setFileHash(sha256);
                child.setPhash(dHash);
                child.setLatitude(latitude);
                child.setLongitude(longitude);
                child.setAccuracy(accuracy);
                child.setCategory(aiResult.getCategory());
                child.setAiSeverity(aiResult.getSeverity());
                child.setStatus(ReportStatus.SUBMITTED);
                child.setParentReport(openCandidate);
                child.setDepartment(openCandidate.getDepartment());
                reportRepository.save(child);

                // Increment parent count and recalculate priority
                openCandidate.setReportCount(openCandidate.getReportCount() + 1);
                int updatedScore = priorityScoringService.calculateScore(
                        openCandidate.getAiSeverity(), openCandidate.getReportCount(), 0,
                        openCandidate.getIsEmergency(), openCandidate.getCategory(),
                        openCandidate.getLatitude(), openCandidate.getLongitude());
                openCandidate.setPriorityScore(updatedScore);
                reportRepository.save(openCandidate);

                notificationService.send(currentUser, openCandidate,
                        "Your report was merged with existing tracked issue #" + openCandidate.getId() + ".",
                        "మీ ఫిర్యాదు ఇప్పటికే ఉన్న సమస్య #" + openCandidate.getId() + " తో జతచేయబడింది.");

                return ReportSubmissionResult.duplicate(child, openCandidate);
            }
        }

        // Check if near recently resolved issue (within 14 days) -> Flag as likely old photo
        List<Report> recentlyResolved = reportRepository.findRecentlyResolvedNear(
                aiResult.getCategory(), LocalDateTime.now().minusDays(14),
                latitude - deltaLat, latitude + deltaLat,
                longitude - deltaLng, longitude + deltaLng
        );
        boolean isOldPhoto = !recentlyResolved.isEmpty();

        // 8. Reverse Geocode address
        String address = geocodingService.reverseGeocode(latitude, longitude);

        // 9. Department Routing
        Department dept = departmentRepository.findByNameIgnoreCase(aiResult.getDepartment())
                .orElseGet(() -> departmentRepository.findAll().stream().findFirst().orElse(null));

        // 10. Compute Priority Score
        int priorityScore = priorityScoringService.calculateScore(
                aiResult.getSeverity(), 1, 0,
                aiResult.isEmergency(), aiResult.getCategory(),
                latitude, longitude
        );

        // 11. Create and Save Report
        Report report = new Report();
        report.setUser(currentUser);
        report.setDescription(description);
        report.setPhotoUrl(photoUrl);
        report.setFileHash(sha256);
        report.setPhash(dHash);
        report.setLatitude(latitude);
        report.setLongitude(longitude);
        report.setAccuracy(accuracy);
        report.setAddress(address);
        report.setCapturedAt(LocalDateTime.now());
        report.setCreatedAt(LocalDateTime.now());
        report.setCategory(aiResult.getCategory());
        report.setAiSeverity(aiResult.getSeverity());
        report.setIsEmergency(aiResult.isEmergency());
        report.setAiSummary(aiResult.getSummaryEn());
        report.setAiCrewEstimate(aiResult.getAiCrewEstimate());
        report.setDepartment(dept);
        report.setPriorityScore(priorityScore);
        report.setStatus(ReportStatus.SUBMITTED);
        report.setReportCount(1);
        report.setIsLikelyOldPhoto(isOldPhoto);

        // 12. Set SLA Deadlines
        slaService.calculateAndSetDeadlines(report);

        Report saved = reportRepository.save(report);

        // Initial status update history
        statusUpdateRepository.save(new StatusUpdate(
                saved, currentUser, ReportStatus.SUBMITTED,
                "Report submitted by citizen. AI routed to " + (dept != null ? dept.getName() : "Municipal Department"),
                null
        ));

        // Send confirmation notification to citizen
        notificationService.send(currentUser, saved,
                "Your problem is noted (#" + saved.getId() + "). We will fix it as fast as we can.",
                "మీ సమస్య నమోదు చేయబడింది (#" + saved.getId() + "). మేము వీలైనంత త్వరగా పరిష్కరిస్తాము.");

        // Notify all L0 & L1 officials in the routed department
        if (dept != null) {
            List<User> deptOfficials = userRepository.findByDepartmentId(dept.getId());
            String emergencyPrefix = saved.getIsEmergency() ? "🚨 EMERGENCY! " : "";
            String notifEn = emergencyPrefix + "New report #" + saved.getId() + " (" + saved.getCategory().name().replace("_", " ") + ") assigned to " + dept.getName() + " department. Priority: " + saved.getPriorityScore();
            String notifTe = emergencyPrefix + "కొత్త ఫిర్యాదు #" + saved.getId() + " " + dept.getName() + " విభాగానికి అందించబడింది.";
            for (User official : deptOfficials) {
                notificationService.send(official, saved, notifEn, notifTe);
            }
        }

        return ReportSubmissionResult.created(saved);
    }

    @Transactional
    public Report updateStatus(Long reportId, User official, StatusUpdateRequest request, MultipartFile afterPhoto) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));

        ReportStatus newStatus = request.getStatus();
        report.setStatus(newStatus);

        String afterPhotoUrl = null;
        if (afterPhoto != null && !afterPhoto.isEmpty()) {
            afterPhotoUrl = storageService.store(afterPhoto);
        }

        if (newStatus == ReportStatus.ACKNOWLEDGED && report.getAcknowledgedAt() == null) {
            report.setAcknowledgedAt(LocalDateTime.now());
        }

        if (newStatus == ReportStatus.RESOLVED) {
            report.setResolvedAt(LocalDateTime.now());
        }

        if (request.getPauseReason() != null && !request.getPauseReason().isBlank()) {
            slaService.pauseTimer(report, official, request.getPauseReason());
        }

        Report updated = reportRepository.save(report);

        // Save status update audit
        statusUpdateRepository.save(new StatusUpdate(
                updated, official, newStatus, request.getComment(), afterPhotoUrl
        ));

        // Notify citizen
        String statusNameEn = newStatus.name().replace("_", " ");
        notificationService.send(report.getUser(), report,
                "Status update for Report #" + report.getId() + ": " + statusNameEn + (request.getComment() != null ? " - " + request.getComment() : ""),
                "మీ ఫిర్యాదు #" + report.getId() + " స్థితి నవీకరించబడింది: " + statusNameEn);

        auditService.log(official, "UPDATE_REPORT_STATUS", "Report #" + report.getId(),
                "Changed status to " + newStatus + (request.getComment() != null ? ", Comment: " + request.getComment() : ""));

        return updated;
    }

    @Transactional
    public void reopenReport(Long reportId, User citizen, String reason) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));

        if (!report.getUser().getId().equals(citizen.getId())) {
            throw new BadRequestException("You can only reopen reports filed by you.");
        }

        report.setStatus(ReportStatus.SUBMITTED);
        report.setReopenCount(report.getReopenCount() + 1);
        report.setResolvedAt(null);
        slaService.calculateAndSetDeadlines(report); // Restart SLA clock
        reportRepository.save(report);

        statusUpdateRepository.save(new StatusUpdate(
                report, citizen, ReportStatus.SUBMITTED,
                "Citizen reported issue not resolved: " + (reason != null ? reason : "Issue persists"), null
        ));

        // Alert department
        if (report.getDepartment() != null) {
            List<User> officials = userRepository.findByDepartmentId(report.getDepartment().getId());
            for (User off : officials) {
                notificationService.send(off, report,
                        "REOPENED: Report #" + report.getId() + " was reopened by the citizen. SLA clock restarted.",
                        "ఫిర్యాదు #" + report.getId() + " పౌరుడిచే తిరిగి తెరవబడింది.");
            }
        }

        auditService.log(citizen, "REOPEN_REPORT", "Report #" + report.getId(), "Reason: " + reason);
    }

    @Transactional
    public boolean toggleUpvote(Long reportId, User citizen) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));

        Optional<ReportUpvote> existing = reportUpvoteRepository.findByReportIdAndUserId(reportId, citizen.getId());
        if (existing.isPresent()) {
            reportUpvoteRepository.delete(existing.get());
            report.setUpvotes(Math.max(0, report.getUpvotes() - 1));
            reportRepository.save(report);
            return false;
        } else {
            reportUpvoteRepository.save(new ReportUpvote(report, citizen));
            report.setUpvotes(report.getUpvotes() + 1);
            reportRepository.save(report);
            return true;
        }
    }

    public List<Report> getPublicMapReports() {
        return reportRepository.findAllByOrderByPriorityScoreDescCreatedAtDesc();
    }

    public List<Report> getUserReports(Long userId) {
        return reportRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Report getReportDetail(Long reportId) {
        return reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));
    }

    public List<StatusUpdate> getReportHistory(Long reportId) {
        return statusUpdateRepository.findByReportIdOrderByCreatedAtAsc(reportId);
    }

    public List<Report> getDepartmentReports(Long departmentId) {
        return reportRepository.findByDepartmentIdOrderByPriorityScoreDescCreatedAtDesc(departmentId);
    }
}
