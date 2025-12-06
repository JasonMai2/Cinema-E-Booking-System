package com.cinemae.booking.dto;

import com.cinemae.booking.model.Booking;
import com.cinemae.booking.model.Ticket;

import java.util.List;

public class CheckoutResult {
    private boolean success;
    private String message;
    private Booking booking;
    private List<Ticket> tickets;
    private String errorMessage;
    private String promotionApplied; // Name of promotion if applied

    // Private constructor
    private CheckoutResult(boolean success, String message, Booking booking, List<Ticket> tickets, 
                          String errorMessage, String promotionApplied) {
        this.success = success;
        this.message = message;
        this.booking = booking;
        this.tickets = tickets;
        this.errorMessage = errorMessage;
        this.promotionApplied = promotionApplied;
    }

    // Factory method for success
    public static CheckoutResult success(Booking booking, List<Ticket> tickets) {
        return new CheckoutResult(true, "Checkout completed successfully", booking, tickets, null, null);
    }

    // Factory method for success with promotion
    public static CheckoutResult successWithPromotion(Booking booking, List<Ticket> tickets, String promotionName) {
        return new CheckoutResult(true, "Checkout completed successfully with promotion applied", 
                                 booking, tickets, null, promotionName);
    }

    // Factory method for failure
    public static CheckoutResult failure(String errorMessage) {
        return new CheckoutResult(false, "Checkout failed", null, null, errorMessage, null);
    }

    // Getters
    public boolean isSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }

    public Booking getBooking() {
        return booking;
    }

    public List<Ticket> getTickets() {
        return tickets;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public String getPromotionApplied() {
        return promotionApplied;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public void setBooking(Booking booking) {
        this.booking = booking;
    }

    public void setTickets(List<Ticket> tickets) {
        this.tickets = tickets;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public void setPromotionApplied(String promotionApplied) {
        this.promotionApplied = promotionApplied;
    }
}
