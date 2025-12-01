package com.cinemae.booking.dto;

public class PaymentRequest {
    private Long bookingId;
    private Integer amount;
    private CheckoutRequest.CardInfo cardInfo;

    // Constructor
    public PaymentRequest() {
    }

    public PaymentRequest(Long bookingId, Integer amount, CheckoutRequest.CardInfo cardInfo) {
        this.bookingId = bookingId;
        this.amount = amount;
        this.cardInfo = cardInfo;
    }

    // Getters and Setters
    public Long bookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public Integer amount() {
        return amount;
    }

    public void setAmount(Integer amount) {
        this.amount = amount;
    }

    public CheckoutRequest.CardInfo cardInfo() {
        return cardInfo;
    }

    public void setCardInfo(CheckoutRequest.CardInfo cardInfo) {
        this.cardInfo = cardInfo;
    }
}
