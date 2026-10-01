package com.warangal360.cityfix.sla;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EscalationLogRepository extends JpaRepository<EscalationLog, Long> {
    List<EscalationLog> findByReportIdOrderByCreatedAtDesc(Long reportId);
}
