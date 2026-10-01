package com.warangal360.cityfix.report;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.warangal360.cityfix.department.Department;
import com.warangal360.cityfix.user.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports", indexes = {
        @Index(name = "idx_report_coords", columnList = "latitude, longitude"),
        @Index(name = "idx_report_status", columnList = "status"),
        @Index(name = "idx_report_dept", columnList = "department_id"),
        @Index(name = "idx_report_category", columnList = "category"),
        @Index(name = "idx_report_file_hash", columnList = "file_hash")
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "photo_url", nullable = false)
    private String photoUrl;

    @Column(name = "file_hash", length = 64)
    private String fileHash;

    @Column(name = "phash", length = 64)
    private String phash;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    private Double accuracy; // GPS accuracy in meters

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "captured_at")
    private LocalDateTime capturedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category = Category.OTHER;

    @Column(name = "ai_severity")
    private Integer aiSeverity = 3;

    @Column(name = "is_emergency")
    private Boolean isEmergency = false;

    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    @Column(name = "ai_crew_estimate")
    private String aiCrewEstimate;

    @Column(name = "priority_score")
    private Integer priorityScore = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.SUBMITTED;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_report_id")
    private Report parentReport;

    @Column(name = "report_count")
    private Integer reportCount = 1;

    @Column(name = "upvotes")
    private Integer upvotes = 0;

    @Column(name = "reopen_count")
    private Integer reopenCount = 0;

    @Column(name = "response_deadline")
    private LocalDateTime responseDeadline;

    @Column(name = "resolution_deadline")
    private LocalDateTime resolutionDeadline;

    @Column(name = "escalation_level")
    private Integer escalationLevel = 0; // 0: Officer, 1: Dept Head, 2: Critically Overdue

    @Column(name = "is_timer_paused")
    private Boolean isTimerPaused = false;

    @Column(name = "timer_pause_reason")
    private String timerPauseReason;

    @Column(name = "needs_manual_review")
    private Boolean needsManualReview = false;

    @Column(name = "is_likely_old_photo")
    private Boolean isLikelyOldPhoto = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    public Report() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public String getFileHash() {
        return fileHash;
    }

    public void setFileHash(String fileHash) {
        this.fileHash = fileHash;
    }

    public String getPhash() {
        return phash;
    }

    public void setPhash(String phash) {
        this.phash = phash;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(Double accuracy) {
        this.accuracy = accuracy;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public LocalDateTime getCapturedAt() {
        return capturedAt;
    }

    public void setCapturedAt(LocalDateTime capturedAt) {
        this.capturedAt = capturedAt;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public Integer getAiSeverity() {
        return aiSeverity;
    }

    public void setAiSeverity(Integer aiSeverity) {
        this.aiSeverity = aiSeverity;
    }

    public Boolean getIsEmergency() {
        return isEmergency;
    }

    public void setIsEmergency(Boolean emergency) {
        isEmergency = emergency;
    }

    public String getAiSummary() {
        return aiSummary;
    }

    public void setAiSummary(String aiSummary) {
        this.aiSummary = aiSummary;
    }

    public String getAiCrewEstimate() {
        return aiCrewEstimate;
    }

    public void setAiCrewEstimate(String aiCrewEstimate) {
        this.aiCrewEstimate = aiCrewEstimate;
    }

    public Integer getPriorityScore() {
        return priorityScore;
    }

    public void setPriorityScore(Integer priorityScore) {
        this.priorityScore = priorityScore;
    }

    public ReportStatus getStatus() {
        return status;
    }

    public void setStatus(ReportStatus status) {
        this.status = status;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public Report getParentReport() {
        return parentReport;
    }

    public void setParentReport(Report parentReport) {
        this.parentReport = parentReport;
    }

    public Integer getReportCount() {
        return reportCount;
    }

    public void setReportCount(Integer reportCount) {
        this.reportCount = reportCount;
    }

    public Integer getUpvotes() {
        return upvotes;
    }

    public void setUpvotes(Integer upvotes) {
        this.upvotes = upvotes;
    }

    public Integer getReopenCount() {
        return reopenCount;
    }

    public void setReopenCount(Integer reopenCount) {
        this.reopenCount = reopenCount;
    }

    public LocalDateTime getResponseDeadline() {
        return responseDeadline;
    }

    public void setResponseDeadline(LocalDateTime responseDeadline) {
        this.responseDeadline = responseDeadline;
    }

    public LocalDateTime getResolutionDeadline() {
        return resolutionDeadline;
    }

    public void setResolutionDeadline(LocalDateTime resolutionDeadline) {
        this.resolutionDeadline = resolutionDeadline;
    }

    public Integer getEscalationLevel() {
        return escalationLevel;
    }

    public void setEscalationLevel(Integer escalationLevel) {
        this.escalationLevel = escalationLevel;
    }

    public Boolean getIsTimerPaused() {
        return isTimerPaused;
    }

    public void setIsTimerPaused(Boolean timerPaused) {
        isTimerPaused = timerPaused;
    }

    public String getTimerPauseReason() {
        return timerPauseReason;
    }

    public void setTimerPauseReason(String timerPauseReason) {
        this.timerPauseReason = timerPauseReason;
    }

    public Boolean getNeedsManualReview() {
        return needsManualReview;
    }

    public void setNeedsManualReview(Boolean needsManualReview) {
        this.needsManualReview = needsManualReview;
    }

    public Boolean getIsLikelyOldPhoto() {
        return isLikelyOldPhoto;
    }

    public void setIsLikelyOldPhoto(Boolean likelyOldPhoto) {
        isLikelyOldPhoto = likelyOldPhoto;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getAcknowledgedAt() {
        return acknowledgedAt;
    }

    public void setAcknowledgedAt(LocalDateTime acknowledgedAt) {
        this.acknowledgedAt = acknowledgedAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
}
