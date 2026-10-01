package com.warangal360.cityfix.sla;

import com.warangal360.cityfix.audit.AuditService;
import com.warangal360.cityfix.notification.NotificationService;
import com.warangal360.cityfix.report.Category;
import com.warangal360.cityfix.report.Report;
import com.warangal360.cityfix.report.ReportRepository;
import com.warangal360.cityfix.report.ReportStatus;
import com.warangal360.cityfix.user.Role;
import com.warangal360.cityfix.user.User;
import com.warangal360.cityfix.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SlaService {

    private final SlaSettingRepository slaSettingRepository;
    private final EscalationLogRepository escalationLogRepository;
    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public SlaService(SlaSettingRepository slaSettingRepository,
                      EscalationLogRepository escalationLogRepository,
                      ReportRepository reportRepository,
                      UserRepository userRepository,
                      NotificationService notificationService,
                      AuditService auditService) {
        this.slaSettingRepository = slaSettingRepository;
        this.escalationLogRepository = escalationLogRepository;
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    public void calculateAndSetDeadlines(Report report) {
        int respHours = 24;
        int resHours = 72;

        if (report.getIsEmergency() || report.getAiSeverity() >= 5) {
            respHours = 2;
            resHours = 24;
        } else {
            var setting = slaSettingRepository.findByCategory(report.getCategory());
            if (setting.isPresent()) {
                respHours = setting.get().getResponseHours();
                resHours = setting.get().getResolutionHours();
            }
        }

        LocalDateTime now = report.getCreatedAt() != null ? report.getCreatedAt() : LocalDateTime.now();
        report.setResponseDeadline(now.plusHours(respHours));
        report.setResolutionDeadline(now.plusHours(resHours));
    }

    @Transactional
    public void checkAndEscalateOverdueReports() {
        LocalDateTime now = LocalDateTime.now();
        List<Report> overdueReports = reportRepository.findOverdueReports(now);

        for (Report report : overdueReports) {
            if (report.getStatus() == ReportStatus.RESOLVED || report.getStatus() == ReportStatus.REJECTED) {
                continue;
            }

            if (report.getEscalationLevel() == 0) {
                // Escalate to Level 1 (Department Head)
                report.setEscalationLevel(1);
                reportRepository.save(report);

                // Find Department Head
                if (report.getDepartment() != null) {
                    List<User> heads = userRepository.findByDepartmentIdAndDesignationLevel(report.getDepartment().getId(), 1);
                    User head = heads.isEmpty() ? null : heads.get(0);

                    escalationLogRepository.save(new EscalationLog(
                            report, 1, head,
                            "Officer missed SLA response deadline of " + report.getResponseDeadline() + ". Escalated to Department Head."
                    ));

                    if (head != null) {
                        notificationService.send(head, report,
                                "OVERDUE ESCALATION: Report #" + report.getId() + " (" + report.getCategory() + ") is overdue and escalated to you.",
                                "అత్యవసర హెచ్చరిక: ఫిర్యాదు #" + report.getId() + " సమయం ముగిసింది. మీ పర్యవేక్షణకు బదిలీ చేయబడింది.");
                    }
                }
            } else if (report.getEscalationLevel() == 1) {
                // If more than 4 hours overdue past Level 1, escalate to Level 2 (Critically Overdue for Admin)
                if (report.getResponseDeadline().plusHours(4).isBefore(now)) {
                    report.setEscalationLevel(2);
                    reportRepository.save(report);

                    List<User> admins = userRepository.findByRole(Role.ROLE_ADMIN);
                    User admin = admins.isEmpty() ? null : admins.get(0);

                    escalationLogRepository.save(new EscalationLog(
                            report, 2, admin,
                            "Critically Overdue: Department Head did not act on escalation. Marked for Admin review."
                    ));
                }
            }
        }
    }

    @Transactional
    public void pauseTimer(Report report, User actor, String reason) {
        report.setIsTimerPaused(true);
        report.setTimerPauseReason(reason);
        reportRepository.save(report);
        auditService.log(actor, "PAUSE_SLA_TIMER", "Report #" + report.getId(), "Reason: " + reason);
    }

    @Transactional
    public void resumeTimer(Report report, User actor) {
        report.setIsTimerPaused(false);
        report.setTimerPauseReason(null);
        reportRepository.save(report);
        auditService.log(actor, "RESUME_SLA_TIMER", "Report #" + report.getId(), "Timer resumed");
    }
}
