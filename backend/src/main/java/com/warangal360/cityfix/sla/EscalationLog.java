package com.warangal360.cityfix.sla;

import com.warangal360.cityfix.report.Report;
import com.warangal360.cityfix.user.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "escalation_log")
public class EscalationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "report_id", nullable = false)
    private Report report;

    @Column(nullable = false)
    private Integer level; // 1: Dept Head, 2: Admin critically overdue

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "alerted_user_id")
    private User alertedUser;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public EscalationLog() {}

    public EscalationLog(Report report, Integer level, User alertedUser, String reason) {
        this.report = report;
        this.level = level;
        this.alertedUser = alertedUser;
        this.reason = reason;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Report getReport() {
        return report;
    }

    public void setReport(Report report) {
        this.report = report;
    }

    public Integer getLevel() {
        return level;
    }

    public void setLevel(Integer level) {
        this.level = level;
    }

    public User getAlertedUser() {
        return alertedUser;
    }

    public void setAlertedUser(User alertedUser) {
        this.alertedUser = alertedUser;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
