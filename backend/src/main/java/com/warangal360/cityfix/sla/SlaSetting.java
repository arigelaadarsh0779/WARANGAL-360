package com.warangal360.cityfix.sla;

import com.warangal360.cityfix.report.Category;
import jakarta.persistence.*;

@Entity
@Table(name = "sla_settings")
public class SlaSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private Category category;

    @Column(name = "response_hours", nullable = false)
    private Integer responseHours;

    @Column(name = "resolution_hours", nullable = false)
    private Integer resolutionHours;

    public SlaSetting() {}

    public SlaSetting(Category category, Integer responseHours, Integer resolutionHours) {
        this.category = category;
        this.responseHours = responseHours;
        this.resolutionHours = resolutionHours;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public Integer getResponseHours() {
        return responseHours;
    }

    public void setResponseHours(Integer responseHours) {
        this.responseHours = responseHours;
    }

    public Integer getResolutionHours() {
        return resolutionHours;
    }

    public void setResolutionHours(Integer resolutionHours) {
        this.resolutionHours = resolutionHours;
    }
}
