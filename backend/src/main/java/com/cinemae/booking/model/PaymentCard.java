package com.cinemae.booking.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_cards")
public class PaymentCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 20)
    private String brand;

    @Column(name = "last4", length = 4, columnDefinition = "CHAR(4)")
    private String last4;

    @Column(name = "exp_month", columnDefinition = "TINYINT UNSIGNED")
    private Byte expMonth;

    @Column(name = "exp_year", columnDefinition = "SMALLINT UNSIGNED")
    private Short expYear;

    @Column(name = "processor_token", nullable = false, length = 191)
    private String processorToken;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Constructors
    public PaymentCard() {
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getLast4() {
        return last4;
    }

    public void setLast4(String last4) {
        this.last4 = last4;
    }

    public Byte getExpMonth() {
        return expMonth;
    }

    public void setExpMonth(Byte expMonth) {
        this.expMonth = expMonth;
    }

    public Short getExpYear() {
        return expYear;
    }

    public void setExpYear(Short expYear) {
        this.expYear = expYear;
    }

    public String getProcessorToken() {
        return processorToken;
    }

    public void setProcessorToken(String processorToken) {
        this.processorToken = processorToken;
    }

    public Boolean getIsDefault() {
        return isDefault;
    }

    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}