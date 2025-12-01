package com.cinemae.booking.dto;

public class PaymentResult {
    private boolean success;
    private String transactionId;
    private String errorMessage;

    // Private constructor
    private PaymentResult(boolean success, String transactionId, String errorMessage) {
        this.success = success;
        this.transactionId = transactionId;
        this.errorMessage = errorMessage;
    }

    // Factory method for success
    public static PaymentResult success(String transactionId) {
        return new PaymentResult(true, transactionId, null);
    }

    // Factory method for failure
    public static PaymentResult failure(String errorMessage) {
        return new PaymentResult(false, null, errorMessage);
    }

    // Getters
    public boolean isSuccess() {
        return success;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}
