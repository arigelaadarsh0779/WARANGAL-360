package com.warangal360.cityfix.sla;

import com.warangal360.cityfix.notice.Notice;
import com.warangal360.cityfix.notice.NoticeRepository;
import com.warangal360.cityfix.notice.NoticeStatus;
import com.warangal360.cityfix.report.Report;
import com.warangal360.cityfix.report.ReportRepository;
import com.warangal360.cityfix.report.ReportStatus;
import com.warangal360.cityfix.report.StatusUpdateRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled cleanup tasks:
 * 1. Auto-delete RESOLVED reports that have been resolved for > 3 hours
 * 2. Auto-expire notices whose endTime has passed
 */
@Component
public class CleanupScheduler {

    private final ReportRepository reportRepository;
    private final NoticeRepository noticeRepository;
    private final JdbcTemplate jdbcTemplate;

    public CleanupScheduler(ReportRepository reportRepository,
                             NoticeRepository noticeRepository,
                             JdbcTemplate jdbcTemplate) {
        this.reportRepository = reportRepository;
        this.noticeRepository = noticeRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Every 10 minutes: auto-delete resolved reports older than 3 hours.
     * Cleans related status_updates, escalation_log, notifications, upvotes safely.
     */
    @Scheduled(fixedDelay = 600000) // every 10 minutes
    @Transactional
    public void deleteOldResolvedReports() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(3);
        List<Report> toDelete = reportRepository.findResolvedBefore(cutoff);
        for (Report r : toDelete) {
            try {
                Long rid = r.getId();
                jdbcTemplate.update("DELETE FROM notifications WHERE report_id = ?", rid);
                jdbcTemplate.update("DELETE FROM escalation_log WHERE report_id = ?", rid);
                jdbcTemplate.update("DELETE FROM status_updates WHERE report_id = ?", rid);
                jdbcTemplate.update("DELETE FROM report_upvotes WHERE report_id = ?", rid);
                // Child duplicate reports: unlink parent
                jdbcTemplate.update("UPDATE reports SET parent_report_id = NULL WHERE parent_report_id = ?", rid);
                reportRepository.deleteById(rid);
            } catch (Exception ignored) {
                // If any FK violation, skip this report silently
            }
        }
    }

    /**
     * Every 5 minutes: expire notices whose endTime has passed.
     */
    @Scheduled(fixedDelay = 300000) // every 5 minutes
    @Transactional
    public void expireOldNotices() {
        List<Notice> expired = noticeRepository.findExpiredNotices(LocalDateTime.now());
        for (Notice n : expired) {
            n.setStatus(NoticeStatus.EXPIRED);
        }
        if (!expired.isEmpty()) {
            noticeRepository.saveAll(expired);
        }
    }
}
