package com.warangal360.cityfix.contact;

import jakarta.persistence.*;

@Entity
@Table(name = "emergency_contacts")
public class EmergencyContact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name_en", nullable = false)
    private String nameEn;

    @Column(name = "name_te", nullable = false)
    private String nameTe;

    @Column(nullable = false)
    private String phone;

    @Column(name = "category_tag")
    private String categoryTag; // POLICE, AMBULANCE, FIRE, DISASTER, MUNICIPAL, ELECTRICITY, WATER

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    public EmergencyContact() {}

    public EmergencyContact(String nameEn, String nameTe, String phone, String categoryTag, Integer displayOrder) {
        this.nameEn = nameEn;
        this.nameTe = nameTe;
        this.phone = phone;
        this.categoryTag = categoryTag;
        this.displayOrder = displayOrder;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNameEn() {
        return nameEn;
    }

    public void setNameEn(String nameEn) {
        this.nameEn = nameEn;
    }

    public String getNameTe() {
        return nameTe;
    }

    public void setNameTe(String nameTe) {
        this.nameTe = nameTe;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getCategoryTag() {
        return categoryTag;
    }

    public void setCategoryTag(String categoryTag) {
        this.categoryTag = categoryTag;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
}
