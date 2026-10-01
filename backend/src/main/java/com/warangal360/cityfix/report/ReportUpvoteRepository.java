package com.warangal360.cityfix.report;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReportUpvoteRepository extends JpaRepository<ReportUpvote, Long> {
    Optional<ReportUpvote> findByReportIdAndUserId(Long reportId, Long userId);
    boolean existsByReportIdAndUserId(Long reportId, Long userId);
    long countByReportId(Long reportId);
}
