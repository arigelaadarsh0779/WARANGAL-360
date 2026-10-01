package com.warangal360.cityfix.notice;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {

    List<Notice> findByStatusOrderByCreatedAtDesc(NoticeStatus status);

    List<Notice> findByDepartmentIdOrderByCreatedAtDesc(Long departmentId);

    @Query("SELECT n FROM Notice n WHERE n.status = 'ACTIVE' AND n.startTime <= :now AND n.endTime >= :now ORDER BY n.type DESC, n.createdAt DESC")
    List<Notice> findCurrentlyActiveNotices(@Param("now") LocalDateTime now);

    @Query("SELECT n FROM Notice n WHERE n.status = 'ACTIVE' AND n.endTime < :now")
    List<Notice> findExpiredNotices(@Param("now") LocalDateTime now);
}
