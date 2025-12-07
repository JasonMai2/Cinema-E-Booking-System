package com.cinemae.booking.service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cinemae.booking.dto.CheckoutRequest;
import com.cinemae.booking.model.Booking;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);
    private final JdbcTemplate jdbc;

    @Autowired
    public BookingService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public Booking createBooking(Long userId, Long showtimeId, 
                                 List<CheckoutRequest.SeatSelection> selectedSeats) {
        return createBooking(userId, showtimeId, selectedSeats, null, 0);
    }

    @Transactional
    public Booking createBooking(Long userId, Long showtimeId,
                                 List<CheckoutRequest.SeatSelection> selectedSeats,
                                 Long promoCodeId, Integer discountCents) {

        log.info("Creating booking for user={}, showtime={}, seats={}, promoCodeId={}, discount={}",
                userId, showtimeId, selectedSeats.size(), promoCodeId, discountCents);

        String bookingNumber = generateBookingNumber();

        int subtotalCents = calculateSubtotal(showtimeId, selectedSeats);

        int discountedSubtotal = subtotalCents;
        if (discountCents != null && discountCents > 0) {
            discountedSubtotal = Math.max(0, subtotalCents - discountCents);
            log.info("Applying discount: {} cents. Subtotal: {} -> {}",
                     discountCents, subtotalCents, discountedSubtotal);
        }

        int feesCents = calculateFees(selectedSeats.size());
        int taxCents = calculateTax(discountedSubtotal + feesCents);
        int totalCents = discountedSubtotal + feesCents + taxCents;

        LocalDateTime now = LocalDateTime.now();

        // FIXED SQL — showtime_id was missing
        if (promoCodeId != null) {
            jdbc.update("""
                INSERT INTO bookings (
                    booking_number, user_id, showtime_id, status,
                    subtotal_cents, fees_cents, tax_cents, total_cents,
                    promo_code_id, created_at
                )
                VALUES (?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?)
            """,
            bookingNumber, userId, showtimeId,
            discountedSubtotal, feesCents, taxCents, totalCents,
            promoCodeId, Timestamp.valueOf(now)
            );
        } else {
            jdbc.update("""
                INSERT INTO bookings (
                    booking_number, user_id, showtime_id, status,
                    subtotal_cents, fees_cents, tax_cents, total_cents,
                    created_at
                )
                VALUES (?, ?, ?, 'PENDING', ?, ?, ?, ?, ?)
            """,
            bookingNumber, userId, showtimeId,
            discountedSubtotal, feesCents, taxCents, totalCents,
            Timestamp.valueOf(now)
            );
        }

        Long bookingId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        log.info("Created booking id={}, number={}, total={} cents", 
                 bookingId, bookingNumber, totalCents);

        Booking booking = new Booking();
        booking.setId(bookingId);
        booking.setBookingNumber(bookingNumber);
        booking.setUserId(userId);
        booking.setShowtimeId(showtimeId);     // <-- add this for completeness
        booking.setStatus("PENDING");
        booking.setSubtotalCents(discountedSubtotal);
        booking.setFeesCents(feesCents);
        booking.setTaxCents(taxCents);
        booking.setTotalCents(totalCents);
        booking.setPromoCodeId(promoCodeId);
        booking.setCreatedAt(now);

        return booking;
    }

    @Transactional
    public void markAsPaid(Long bookingId) {
        log.info("Marking booking {} as PAID", bookingId);
        jdbc.update("UPDATE bookings SET status = 'PAID' WHERE id = ?", bookingId);
    }

    @Transactional
    public void markAsFailed(Long bookingId) {
        log.info("Marking booking {} as CANCELLED (payment failed)", bookingId);
        jdbc.update("UPDATE bookings SET status = 'CANCELLED' WHERE id = ?", bookingId);
    }

    private String generateBookingNumber() {
        return "BK" + UUID.randomUUID().toString().replace("-", "")
                .substring(0, 12).toUpperCase();
    }

    private int calculateSubtotal(Long showtimeId, 
                                  List<CheckoutRequest.SeatSelection> selectedSeats) {

        Map<String, Integer> prices = getTicketTypePrices();
        int subtotal = 0;

        for (CheckoutRequest.SeatSelection seat : selectedSeats) {
            String cat = seat.getAgeCategory() == null ? "adult"
                        : seat.getAgeCategory().toLowerCase();

            Integer price = prices.get(cat);
            if (price == null) {
                price = prices.getOrDefault("adult", 1500);
                log.warn("Unknown age category '{}', using adult price.", cat);
            }

            subtotal += price;
        }

        log.info("Calculated subtotal: {} cents for {} seats", subtotal, selectedSeats.size());
        return subtotal;
    }

    private Map<String, Integer> getTicketTypePrices() {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT age_category, price_cents FROM ticket_types WHERE is_active = 1"
        );

        Map<String, Integer> priceMap = new java.util.HashMap<>();
        for (Map<String, Object> row : rows) {
            priceMap.put(((String) row.get("age_category")).toLowerCase(),
                         (Integer) row.get("price_cents"));
        }

        if (priceMap.isEmpty()) {
            // Fallback defaults only if database has no ticket types
            log.warn("No ticket types found in database, using fallback defaults");
            priceMap.put("child", 900);
            priceMap.put("adult", 1500);
            priceMap.put("senior", 1100);
        }

        return priceMap;
    }

    private int calculateFees(int numSeats) {
        // Try to get booking fee from price_rules table, fallback to $1.50
        try {
            Integer bookingFeeCents = jdbc.queryForObject(
                "SELECT booking_fee_cents FROM price_rules WHERE active = true AND scope = 'GLOBAL' LIMIT 1",
                Integer.class
            );
            if (bookingFeeCents != null) {
                return numSeats * bookingFeeCents;
            }
        } catch (Exception e) {
            // Table may not exist or no global rule found
        }
        return numSeats * 150; // Fallback: $1.50 per ticket
    }

    private int calculateTax(int taxableAmount) {
        // Try to get tax rate from settings, fallback to 8%
        try {
            Double taxRate = jdbc.queryForObject(
                "SELECT tax_rate FROM settings WHERE setting_key = 'tax_rate' LIMIT 1",
                Double.class
            );
            if (taxRate != null) {
                return (int) Math.round(taxableAmount * taxRate);
            }
        } catch (Exception e) {
            // Table may not exist or no setting found
        }
        return (int) Math.round(taxableAmount * 0.08); // Fallback: 8% tax
    }
}