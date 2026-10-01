package com.warangal360.cityfix.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPhone(String phone);
    boolean existsByPhone(String phone);
    List<User> findByDepartmentId(Long departmentId);
    List<User> findByDepartmentIdAndDesignationLevel(Long departmentId, Integer designationLevel);
    List<User> findByRole(Role role);
}
