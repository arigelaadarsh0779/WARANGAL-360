package com.warangal360.cityfix.ai;

import com.warangal360.cityfix.report.Category;

public class AiAnalysisResult {
    private boolean isCivicIssue = true;
    private String rejectionReason;
    private Category category = Category.OTHER;
    private int severity = 3;
    private boolean isEmergency = false;
    private String summaryEn = "Civic issue reported in Warangal";
    private String department = "Sanitation";
    private boolean isScreenshotOrInternetImage = false;
    private String aiCrewEstimate = "2 field workers + standard equipment";

    public AiAnalysisResult() {}

    public boolean isCivicIssue() {
        return isCivicIssue;
    }

    public void setCivicIssue(boolean civicIssue) {
        isCivicIssue = civicIssue;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public int getSeverity() {
        return severity;
    }

    public void setSeverity(int severity) {
        this.severity = severity;
    }

    public boolean isEmergency() {
        return isEmergency;
    }

    public void setEmergency(boolean emergency) {
        isEmergency = emergency;
    }

    public String getSummaryEn() {
        return summaryEn;
    }

    public void setSummaryEn(String summaryEn) {
        this.summaryEn = summaryEn;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public boolean isScreenshotOrInternetImage() {
        return isScreenshotOrInternetImage;
    }

    public void setScreenshotOrInternetImage(boolean screenshotOrInternetImage) {
        isScreenshotOrInternetImage = screenshotOrInternetImage;
    }

    public String getAiCrewEstimate() {
        return aiCrewEstimate;
    }

    public void setAiCrewEstimate(String aiCrewEstimate) {
        this.aiCrewEstimate = aiCrewEstimate;
    }
}
