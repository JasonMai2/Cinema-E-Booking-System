package com.cinemae.booking.dto;

import java.util.List;
import java.util.Map;

public class CheckoutRequest {
    private Long userId;
    private Long showtimeId;
    private List<SeatSelection> selectedSeats;
    private CardInfo cardInfo;
    private String promoCode; // Optional promotion code

    // Constructor
    public CheckoutRequest() {
    }

    public CheckoutRequest(Long userId, Long showtimeId, List<SeatSelection> selectedSeats, CardInfo cardInfo) {
        this.userId = userId;
        this.showtimeId = showtimeId;
        this.selectedSeats = selectedSeats;
        this.cardInfo = cardInfo;
    }

    public CheckoutRequest(Long userId, Long showtimeId, List<SeatSelection> selectedSeats, CardInfo cardInfo, String promoCode) {
        this.userId = userId;
        this.showtimeId = showtimeId;
        this.selectedSeats = selectedSeats;
        this.cardInfo = cardInfo;
        this.promoCode = promoCode;
    }

    // Getters and Setters
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getShowtimeId() {
        return showtimeId;
    }

    public void setShowtimeId(Long showtimeId) {
        this.showtimeId = showtimeId;
    }

    public List<SeatSelection> getSelectedSeats() {
        return selectedSeats;
    }

    public void setSelectedSeats(List<SeatSelection> selectedSeats) {
        this.selectedSeats = selectedSeats;
    }

    public CardInfo getCardInfo() {
        return cardInfo;
    }

    public void setCardInfo(CardInfo cardInfo) {
        this.cardInfo = cardInfo;
    }

    public String getPromoCode() {
        return promoCode;
    }

    public void setPromoCode(String promoCode) {
        this.promoCode = promoCode;
    }

    // Inner class for seat selection
    public static class SeatSelection {
        private Long seatId;
        private String ageCategory; // CHILD, ADULT, SENIOR

        public SeatSelection() {
        }

        public SeatSelection(Long seatId, String ageCategory) {
            this.seatId = seatId;
            this.ageCategory = ageCategory;
        }

        public Long getSeatId() {
            return seatId;
        }

        public void setSeatId(Long seatId) {
            this.seatId = seatId;
        }

        public String getAgeCategory() {
            return ageCategory;
        }

        public void setAgeCategory(String ageCategory) {
            this.ageCategory = ageCategory;
        }
    }

    // Inner class for card info
    public static class CardInfo {
        private String cardNumber;
        private String cvv;
        private Integer expMonth;
        private Integer expYear;
        private String billingAddress;

        public CardInfo() {
        }

        public CardInfo(String cardNumber, String cvv, Integer expMonth, Integer expYear, String billingAddress) {
            this.cardNumber = cardNumber;
            this.cvv = cvv;
            this.expMonth = expMonth;
            this.expYear = expYear;
            this.billingAddress = billingAddress;
        }

        public String getCardNumber() {
            return cardNumber;
        }

        public void setCardNumber(String cardNumber) {
            this.cardNumber = cardNumber;
        }

        public String getCvv() {
            return cvv;
        }

        public void setCvv(String cvv) {
            this.cvv = cvv;
        }

        public Integer getExpMonth() {
            return expMonth;
        }

        public void setExpMonth(Integer expMonth) {
            this.expMonth = expMonth;
        }

        public Integer getExpYear() {
            return expYear;
        }

        public void setExpYear(Integer expYear) {
            this.expYear = expYear;
        }

        public String getBillingAddress() {
            return billingAddress;
        }

        public void setBillingAddress(String billingAddress) {
            this.billingAddress = billingAddress;
        }
    }
}
