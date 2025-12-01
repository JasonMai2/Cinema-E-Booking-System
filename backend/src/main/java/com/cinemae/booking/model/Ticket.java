package com.cinemae.booking.model;

public class Ticket {
    private Long id;
    private String ticketNumber;
    private Long bookingId;
    private Long showtimeId;
    private Long seatId;
    private String ageCategory; // CHILD, ADULT, SENIOR
    private Integer priceCents;
    
    // Additional info for display
    private String movieTitle;
    private String auditoriumName;
    private String seatLabel;
    private String showtimeStart;

    // Constructor
    public Ticket() {
    }

    public Ticket(Long id, String ticketNumber, Long bookingId, Long showtimeId,
                  Long seatId, String ageCategory, Integer priceCents) {
        this.id = id;
        this.ticketNumber = ticketNumber;
        this.bookingId = bookingId;
        this.showtimeId = showtimeId;
        this.seatId = seatId;
        this.ageCategory = ageCategory;
        this.priceCents = priceCents;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTicketNumber() {
        return ticketNumber;
    }

    public void setTicketNumber(String ticketNumber) {
        this.ticketNumber = ticketNumber;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public Long getShowtimeId() {
        return showtimeId;
    }

    public void setShowtimeId(Long showtimeId) {
        this.showtimeId = showtimeId;
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

    public Integer getPriceCents() {
        return priceCents;
    }

    public void setPriceCents(Integer priceCents) {
        this.priceCents = priceCents;
    }

    public String getMovieTitle() {
        return movieTitle;
    }

    public void setMovieTitle(String movieTitle) {
        this.movieTitle = movieTitle;
    }

    public String getAuditoriumName() {
        return auditoriumName;
    }

    public void setAuditoriumName(String auditoriumName) {
        this.auditoriumName = auditoriumName;
    }

    public String getSeatLabel() {
        return seatLabel;
    }

    public void setSeatLabel(String seatLabel) {
        this.seatLabel = seatLabel;
    }

    public String getShowtimeStart() {
        return showtimeStart;
    }

    public void setShowtimeStart(String showtimeStart) {
        this.showtimeStart = showtimeStart;
    }
}
