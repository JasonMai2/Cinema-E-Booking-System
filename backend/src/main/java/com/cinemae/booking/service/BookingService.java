package com.cinemae.booking.service;

import com.cinemae.booking.dto.CheckoutRequest;
import com.cinemae.booking.model.Booking;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service for managing bookings.
 * Handles booking creation, seat reservation, price calculation, and status management.
 */
@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);
    private final JdbcTemplate jdbc;

    @Autowired
    public BookingService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Create a booking with seat reservation and price calculation.
     * 
     * @param userId User making the booking
     * @param showtimeId Showtime for the booking
     * @param selectedSeats List of selected seats with age categories
     * @return Created booking with calculated prices
     */
    @Transactional
    public Booking createBooking(Long userId, Long showtimeId, List<CheckoutRequest.SeatSelection> selectedSeats) {
        return createBooking(userId, showtimeId, selectedSeats, null, 0);
    }

    /**
     * Create a booking with seat reservation, price calculation, and optional promotion.
     * 
     * @param userId User making the booking
     * @param showtimeId Showtime for the booking
     * @param selectedSeats List of selected seats with age categories
     * @param promoCodeId Optional promotion code ID (can be null)
     * @param discountCents Discount amount in cents (0 if no promotion)
     * @return Created booking with calculated prices including discount
     */
    @Transactional
    public Booking createBooking(Long userId, Long showtimeId, List<CheckoutRequest.SeatSelection> selectedSeats, 
                                 Long promoCodeId, Integer discountCents) {
        log.info("Creating booking for user={}, showtime={}, seats={}, promoCodeId={}, discount={}", 
                 userId, showtimeId, selectedSeats.size(), promoCodeId, discountCents);

        // Generate unique booking number
        String bookingNumber = generateBookingNumber();

        // Calculate prices based on age categories and pricing rules
        int subtotalCents = calculateSubtotal(showtimeId, selectedSeats);
        
        // Apply discount if promotion code provided
        int discountedSubtotal = subtotalCents;
        if (discountCents != null && discountCents > 0) {
            discountedSubtotal = Math.max(0, subtotalCents - discountCents); // Don't go negative
            log.info("Applying discount: {} cents. Subtotal: {} -> {}", 
                     discountCents, subtotalCents, discountedSubtotal);
        }
        
        int feesCents = calculateFees(selectedSeats.size());
        int taxCents = calculateTax(discountedSubtotal + feesCents);
        int totalCents = discountedSubtotal + feesCents + taxCents;

        // Insert booking with promo code if provided
        if (promoCodeId != null) {
            jdbc.update(
                "INSERT INTO bookings (booking_number, user_id, status, subtotal_cents, fees_cents, tax_cents, total_cents, promo_code_id, created_at) " +
                "VALUES (?, ?, 'PENDING', ?, ?, ?, ?, ?, ?)",
                bookingNumber, userId, discountedSubtotal, feesCents, taxCents, totalCents, promoCodeId, Timestamp.valueOf(LocalDateTime.now())
            );
        } else {
            jdbc.update(
                "INSERT INTO bookings (booking_number, user_id, status, subtotal_cents, fees_cents, tax_cents, total_cents, created_at) " +
                "VALUES (?, ?, 'PENDING', ?, ?, ?, ?, ?)",
                bookingNumber, userId, discountedSubtotal, feesCents, taxCents, totalCents, Timestamp.valueOf(LocalDateTime.now())
            );
        }

        Long bookingId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

        log.info("Created booking id={}, number={}, total={} cents", bookingId, bookingNumber, totalCents);

        // Return booking object
        Booking booking = new Booking();
        booking.setId(bookingId);
        booking.setBookingNumber(bookingNumber);
        booking.setUserId(userId);
        booking.setStatus("PENDING");
        booking.setSubtotalCents(discountedSubtotal);
        booking.setFeesCents(feesCents);
        booking.setTaxCents(taxCents);
        booking.setTotalCents(totalCents);
        booking.setPromoCodeId(promoCodeId);
        booking.setCreatedAt(LocalDateTime.now());

        return booking;
    }

    /**
     * Mark booking as paid after successful payment.
     */
    @Transactional
    public void markAsPaid(Long bookingId) {
        log.info("Marking booking {} as PAID", bookingId);
        jdbc.update("UPDATE bookings SET status = 'PAID' WHERE id = ?", bookingId);
    }

    /**
     * Mark booking as failed if payment fails.
     */
    @Transactional
    public void markAsFailed(Long bookingId) {
        log.info("Marking booking {} as CANCELLED (payment failed)", bookingId);
        jdbc.update("UPDATE bookings SET status = 'CANCELLED' WHERE id = ?", bookingId);
    }

    /**
     * Generate a unique booking number (14 characters).
     */
    private String generateBookingNumber() {
        return "BK" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }

    /**
     * Calculate subtotal based on seat age categories and pricing rules.
     */
    private int calculateSubtotal(Long showtimeId, List<CheckoutRequest.SeatSelection> selectedSeats) {
        // Get pricing for this showtime
        Map<String, Integer> prices = getPricing(showtimeId);
        
        int subtotal = 0;
        for (CheckoutRequest.SeatSelection seat : selectedSeats) {
            String ageCategory = seat.getAgeCategory() != null ? seat.getAgeCategory().toUpperCase() : "ADULT";
            Integer price = prices.get(ageCategory + "_CENTS");
            if (price != null) {
                subtotal += price;
            } else {
                // Default to adult price if category not found
                subtotal += prices.getOrDefault("ADULT_CENTS", 1200); // $12.00 default
            }
        }
        
        return subtotal;
    }

    /**
     * Get pricing for a showtime (checks showtime-specific, movie-specific, then global rules).
     */
    private Map<String, Integer> getPricing(Long showtimeId) {
        // Try to get showtime-specific pricing first
        List<Map<String, Object>> rules = jdbc.queryForList(
            "SELECT child_cents, adult_cents, senior_cents, booking_fee_cents " +
            "FROM price_rules " +
            "WHERE scope = 'SHOWTIME' AND showtime_id = ? AND active = TRUE " +
            "AND (effective_to IS NULL OR effective_to > NOW()) " +
            "ORDER BY effective_from DESC LIMIT 1",
            showtimeId
        );

        if (rules.isEmpty()) {
            // Try movie-specific pricing
            Long movieId = jdbc.queryForObject(
                "SELECT movie_id FROM showtimes WHERE id = ?", Long.class, showtimeId
            );
            rules = jdbc.queryForList(
                "SELECT child_cents, adult_cents, senior_cents, booking_fee_cents " +
                "FROM price_rules " +
                "WHERE scope = 'MOVIE' AND movie_id = ? AND active = TRUE " +
                "AND (effective_to IS NULL OR effective_to > NOW()) " +
                "ORDER BY effective_from DESC LIMIT 1",
                movieId
            );
        }

        if (rules.isEmpty()) {
            // Fall back to global pricing
            rules = jdbc.queryForList(
                "SELECT child_cents, adult_cents, senior_cents, booking_fee_cents " +
                "FROM price_rules " +
                "WHERE scope = 'GLOBAL' AND active = TRUE " +
                "AND (effective_to IS NULL OR effective_to > NOW()) " +
                "ORDER BY effective_from DESC LIMIT 1"
            );
        }

        if (rules.isEmpty()) {
            // Ultimate fallback: default prices
            return Map.of(
                "CHILD_CENTS", 800,   // $8.00
                "ADULT_CENTS", 1200,  // $12.00
                "SENIOR_CENTS", 900,  // $9.00
                "BOOKING_FEE", 150    // $1.50
            );
        }

        Map<String, Object> rule = rules.get(0);
        return Map.of(
            "CHILD_CENTS", (Integer) rule.get("child_cents"),
            "ADULT_CENTS", (Integer) rule.get("adult_cents"),
            "SENIOR_CENTS", (Integer) rule.get("senior_cents"),
            "BOOKING_FEE", (Integer) rule.get("booking_fee_cents")
        );
    }

    /**
     * Calculate booking fees (per-ticket fee).
     */
    private int calculateFees(int numberOfSeats) {
        // $1.50 per ticket
        return numberOfSeats * 150;
    }

    /**
     * Calculate tax (8% of subtotal + fees).
     */
    private int calculateTax(int taxableAmount) {
        // 8% tax
        return (int) Math.round(taxableAmount * 0.08);
    }
}
