package com.warangal360.cityfix.analytics;

import com.warangal360.cityfix.report.Report;
import com.warangal360.cityfix.report.ReportRepository;
import com.warangal360.cityfix.report.ReportStatus;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final ReportRepository reportRepository;

    public AnalyticsService(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    public Map<String, Object> getAdminAnalytics() {
        List<Report> allReports = reportRepository.findAll();

        long total = allReports.size();
        long open = allReports.stream().filter(r -> r.getStatus() != ReportStatus.RESOLVED && r.getStatus() != ReportStatus.REJECTED).count();
        long resolved = allReports.stream().filter(r -> r.getStatus() == ReportStatus.RESOLVED).count();
        long rejected = allReports.stream().filter(r -> r.getStatus() == ReportStatus.REJECTED).count();
        long overdue = allReports.stream().filter(r -> r.getEscalationLevel() != null && r.getEscalationLevel() >= 1 && r.getStatus() != ReportStatus.RESOLVED && r.getStatus() != ReportStatus.REJECTED).count();
        long criticallyOverdue = allReports.stream().filter(r -> r.getEscalationLevel() != null && r.getEscalationLevel() == 2 && r.getStatus() != ReportStatus.RESOLVED && r.getStatus() != ReportStatus.REJECTED).count();
        long duplicatesMerged = allReports.stream().filter(r -> r.getParentReport() != null || (r.getReportCount() != null && r.getReportCount() > 1)).count();

        // By Category
        Map<String, Long> byCategory = allReports.stream()
                .collect(Collectors.groupingBy(r -> r.getCategory().name(), Collectors.counting()));

        // By Department
        Map<String, Long> byDepartment = allReports.stream()
                .filter(r -> r.getDepartment() != null)
                .collect(Collectors.groupingBy(r -> r.getDepartment().getName(), Collectors.counting()));

        // By Status
        Map<String, Long> byStatus = allReports.stream()
                .collect(Collectors.groupingBy(r -> r.getStatus().name(), Collectors.counting()));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalReports", total);
        response.put("openReports", open);
        response.put("resolvedReports", resolved);
        response.put("rejectedReports", rejected);
        response.put("overdueReports", overdue);
        response.put("criticallyOverdueReports", criticallyOverdue);
        response.put("duplicatesMerged", duplicatesMerged);
        response.put("byCategory", byCategory);
        response.put("byDepartment", byDepartment);
        response.put("byStatus", byStatus);

        return response;
    }
}
