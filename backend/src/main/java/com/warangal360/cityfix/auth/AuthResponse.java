package com.warangal360.cityfix.auth;

import com.warangal360.cityfix.user.Role;

public class AuthResponse {
    private String token;
    private Long userId;
    private String name;
    private String phone;
    private Role role;
    private Long departmentId;
    private String departmentName;
    private Integer designationLevel;
    private Boolean mustChangePassword;
    private String preferredLanguage;

    public AuthResponse() {}

    public AuthResponse(String token, Long userId, String name, String phone, Role role,
                        Long departmentId, String departmentName, Integer designationLevel,
                        Boolean mustChangePassword, String preferredLanguage) {
        this.token = token;
        this.userId = userId;
        this.name = name;
        this.phone = phone;
        this.role = role;
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.designationLevel = designationLevel;
        this.mustChangePassword = mustChangePassword;
        this.preferredLanguage = preferredLanguage;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public Integer getDesignationLevel() {
        return designationLevel;
    }

    public void setDesignationLevel(Integer designationLevel) {
        this.designationLevel = designationLevel;
    }

    public Boolean getMustChangePassword() {
        return mustChangePassword;
    }

    public void setMustChangePassword(Boolean mustChangePassword) {
        this.mustChangePassword = mustChangePassword;
    }

    public String getPreferredLanguage() {
        return preferredLanguage;
    }

    public void setPreferredLanguage(String preferredLanguage) {
        this.preferredLanguage = preferredLanguage;
    }
}
