package com.warangal360.cityfix.sla;

import com.warangal360.cityfix.report.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SlaSettingRepository extends JpaRepository<SlaSetting, Long> {
    Optional<SlaSetting> findByCategory(Category category);
}
