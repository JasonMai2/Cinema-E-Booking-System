package com.cinemae.booking.model;

import java.time.LocalDateTime;
import java.util.List;

public class Booking {
    private Long id;
    private String bookingNumber;
    private Long userId;
    private Long showtimeId;  // <-- ADDED FIELD
    private String status; // PENDING, PAID, CANCELLED, EXPIRED
    private Integer subtotalCents;
    private Integer feesCents;
    private Integer taxCents;
    private Integer totalCents;
    private Long promoCodeId;
    private LocalDateTime createdAt;

    public Booking() {}

    public Booking(Long id, String bookingNumber, Long userId, Long showtimeId,
                   String status, Integer subtotalCents, Integer feesCents,
                   Integer taxCents, Integer totalCents, Long promoCodeId,
                   LocalDateTime createdAt) {

        this.id = id;
        this.bookingNumber = bookingNumber;
        this.userId = userId;
        this.showtimeId = showtimeId;
        this.status = status;
        this.subtotalCents = subtotalCents;
        this.feesCents = feesCents;
        this.taxCents = taxCents;
        this.totalCents = totalCents;
        this.promoCodeId = promoCodeId;
        this.createdAt = createdAt;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBookingNumber() { return bookingNumber; }
    public void setBookingNumber(String bookingNumber) { this.bookingNumber = bookingNumber; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getShowtimeId() { return showtimeId; }  // <-- ADDED
    public void setShowtimeId(Long showtimeId) { this.showtimeId = showtimeId; }  // <-- ADDED

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getSubtotalCents() { return subtotalCents; }
    public void setSubtotalCents(Integer subtotalCents) { this.subtotalCents = subtotalCents; }

    public Integer getFeesCents() { return feesCents; }
    public void setFeesCents(Integer feesCents) { this.feesCents = feesCents; }

    public Integer getTaxCents() { return taxCents; }
    public void setTaxCents(Integer taxCents) { this.taxCents = taxCents; }

    public Integer getTotalCents() { return totalCents; }
    public void setTotalCents(Integer totalCents) { this.totalCents = totalCents; }

    public Long getPromoCodeId() { return promoCodeId; }
    public void setPromoCodeId(Long promoCodeId) { this.promoCodeId = promoCodeId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Integer getTotalPrice() { return totalCents; }
}
