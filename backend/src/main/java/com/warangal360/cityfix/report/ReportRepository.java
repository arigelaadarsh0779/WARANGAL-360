package com.warangal360.cityfix.report;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Report> findByDepartmentIdOrderByPriorityScoreDescCreatedAtDesc(Long departmentId);

    List<Report> findByStatusNotOrderByPriorityScoreDescCreatedAtDesc(ReportStatus status);

    List<Report> findAllByOrderByPriorityScoreDescCreatedAtDesc();

    List<Report> findByParentReportIsNullOrderByCreatedAtDesc();

    Optional<Report> findByFileHash(String fileHash);

    // Count user submissions today for rate limiting
    @Query("SELECT COUNT(r) FROM Report r WHERE r.user.id = :userId AND r.createdAt >= :startOfDay")
    long countUserReportsToday(@Param("userId") Long userId, @Param("startOfDay") LocalDateTime startOfDay);

    // Find candidate open duplicate reports of same category within bounding box
    @Query("SELECT r FROM Report r WHERE r.category = :category AND r.status IN ('SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS') " +
           "AND r.parentReport IS NULL " +
           "AND r.latitude BETWEEN :minLat AND :maxLat AND r.longitude BETWEEN :minLng AND :maxLng")
    List<Report> findOpenCandidateDuplicates(
            @Param("category") Category category,
            @Param("minLat") Double minLat,
            @Param("maxLat") Double maxLat,
            @Param("minLng") Double minLng,
            @Param("maxLng") Double maxLng);

    // Find candidate recently resolved reports nearby (to detect old photo reuse)
    @Query("SELECT r FROM Report r WHERE r.category = :category AND r.status = 'RESOLVED' " +
           "AND r.resolvedAt >= :resolvedSince " +
           "AND r.latitude BETWEEN :minLat AND :maxLat AND r.longitude BETWEEN :minLng AND :maxLng")
    List<Report> findRecentlyResolvedNear(
            @Param("category") Category category,
            @Param("resolvedSince") LocalDateTime resolvedSince,
            @Param("minLat") Double minLat,
            @Param("maxLat") Double maxLat,
            @Param("minLng") Double minLng,
            @Param("maxLng") Double maxLng);

    // Overdue reports: SUBMITTED or ACKNOWLEDGED with responseDeadline passed and not yet resolved/rejected
    @Query("SELECT r FROM Report r WHERE r.status IN ('SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS') " +
           "AND r.isTimerPaused = false " +
           "AND (r.responseDeadline < :now OR r.resolutionDeadline < :now)")
    List<Report> findOverdueReports(@Param("now") LocalDateTime now);

    @Query("SELECT r FROM Report r WHERE r.escalationLevel = 2 AND r.status NOT IN ('RESOLVED', 'REJECTED') ORDER BY r.priorityScore DESC")
    List<Report> findCriticallyOverdueReports();

    @Query("SELECT r FROM Report r WHERE r.escalationLevel >= 1 AND r.department.id = :departmentId AND r.status NOT IN ('RESOLVED', 'REJECTED') ORDER BY r.priorityScore DESC")
    List<Report> findEscalatedToDeptHead(@Param("departmentId") Long departmentId);

    // Reports resolved more than N hours ago — for auto-cleanup
    @Query("SELECT r FROM Report r WHERE r.status = 'RESOLVED' AND r.resolvedAt < :cutoff")
    List<Report> findResolvedBefore(@Param("cutoff") LocalDateTime cutoff);
}
