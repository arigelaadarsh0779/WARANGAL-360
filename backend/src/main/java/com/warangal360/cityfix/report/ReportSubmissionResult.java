package com.warangal360.cityfix.report;

public class ReportSubmissionResult {
    private String outcome; // "CREATED", "DUPLICATE_MERGED", "REJECTED"
    private Long reportId;
    private Long parentReportId;
    private String category;
    private String departmentName;
    private Integer priorityScore;
    private String message;
    private String messageTe;
    private String rejectionReason;

    public ReportSubmissionResult() {}

    public static ReportSubmissionResult created(Report report) {
        ReportSubmissionResult res = new ReportSubmissionResult();
        res.outcome = "CREATED";
        res.reportId = report.getId();
        res.category = report.getCategory().name();
        res.departmentName = report.getDepartment() != null ? report.getDepartment().getName() : "Municipal";
        res.priorityScore = report.getPriorityScore();
        res.message = "Your problem is noted. We will fix it as fast as we can.";
        res.messageTe = "మీ సమస్య నమోదు చేయబడింది. మేము వీలైనంత త్వరగా పరిష్కరిస్తాము.";
        return res;
    }

    public static ReportSubmissionResult duplicate(Report child, Report parent) {
        ReportSubmissionResult res = new ReportSubmissionResult();
        res.outcome = "DUPLICATE_MERGED";
        res.reportId = child.getId();
        res.parentReportId = parent.getId();
        res.category = parent.getCategory().name();
        res.departmentName = parent.getDepartment() != null ? parent.getDepartment().getName() : "Municipal";
        res.priorityScore = parent.getPriorityScore();
        res.message = "This issue is already reported and being tracked. You are counted as support (Report #" + parent.getId() + ").";
        res.messageTe = "ఈ సమస్య ఇప్పటికే నమోదు చేయబడి పర్యవేక్షించబడుతోంది. మీ మద్దతు కూడా చేర్చబడింది (ఫిర్యాదు #" + parent.getId() + ").";
        return res;
    }

    public static ReportSubmissionResult rejected(String reason) {
        ReportSubmissionResult res = new ReportSubmissionResult();
        res.outcome = "REJECTED";
        res.rejectionReason = reason;
        res.message = "Report could not be accepted: " + reason;
        res.messageTe = "ఫిర్యాదు తిరస్కరించబడింది: " + reason;
        return res;
    }

    public String getOutcome() { return outcome; }
    public void setOutcome(String outcome) { this.outcome = outcome; }
    public Long getReportId() { return reportId; }
    public void setReportId(Long reportId) { this.reportId = reportId; }
    public Long getParentReportId() { return parentReportId; }
    public void setParentReportId(Long parentReportId) { this.parentReportId = parentReportId; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
    public Integer getPriorityScore() { return priorityScore; }
    public void setPriorityScore(Integer priorityScore) { this.priorityScore = priorityScore; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getMessageTe() { return messageTe; }
    public void setMessageTe(String messageTe) { this.messageTe = messageTe; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
}
