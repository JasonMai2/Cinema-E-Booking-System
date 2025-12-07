package com.cinemae.booking.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cinemae.booking.dto.CheckoutRequest;
import com.cinemae.booking.dto.CheckoutResult;
import com.cinemae.booking.facade.CheckoutFacade;
import com.cinemae.booking.model.Booking;

/**
 * REST Controller for the checkout process and order management.
 * This controller exposes checkout and order endpoints.
 */
@RestController
@RequestMapping("/api")
public class CheckoutController {

    private static final Logger log = LoggerFactory.getLogger(CheckoutController.class);

    private final CheckoutFacade checkoutFacade;
    private final JdbcTemplate jdbc;

    @Autowired
    public CheckoutController(CheckoutFacade checkoutFacade, JdbcTemplate jdbc) {
        this.checkoutFacade = checkoutFacade;
        this.jdbc = jdbc;
    }

    /**
     * Process checkout for a booking.
     */
    @PostMapping("/checkout")
    public ResponseEntity<Map<String, Object>> checkout(@RequestBody Map<String, Object> requestBody) {
        try {
            log.info("Checkout request received with body: {}", requestBody);
            
            Long userId = requestBody.get("userId") != null ? ((Number) requestBody.get("userId")).longValue() : null;
            Long showId = requestBody.get("showId") != null ? ((Number) requestBody.get("showId")).longValue() : null;
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> seatsRaw = (List<Map<String, Object>>) requestBody.get("seats");
            Long paymentMethodId = requestBody.get("paymentMethodId") != null ? ((Number) requestBody.get("paymentMethodId")).longValue() : null;
            String promoCode = requestBody.get("promoCode") != null ? requestBody.get("promoCode").toString() : null;

            log.info("Checkout request received for user {}", userId);

            // Validation
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "User ID is required"));
            }
            if (showId == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Showtime ID is required"));
            }
            if (seatsRaw == null || seatsRaw.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "At least one seat must be selected"));
            }
            if (paymentMethodId == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Payment method is required"));
            }

            // Build CheckoutRequest
            CheckoutRequest request = new CheckoutRequest();
            request.setUserId(userId);
            request.setShowtimeId(showId);
            request.setPromoCode(promoCode);

            List<CheckoutRequest.SeatSelection> seatSelections = seatsRaw.stream()
                .map(seat -> {
                    Long seatId = seat.get("seatId") != null ? ((Number) seat.get("seatId")).longValue() : null;
                    String ageCategory = seat.get("ageCategory") != null ? (String) seat.get("ageCategory") : "ADULT";

                    if (seatId == null) {
                        throw new IllegalArgumentException("Seat ID is missing from seat data");
                    }
                    return new CheckoutRequest.SeatSelection(seatId, ageCategory);
                })
                .collect(Collectors.toList());

            request.setSelectedSeats(seatSelections);

            // Demo payment card
            CheckoutRequest.CardInfo cardInfo = new CheckoutRequest.CardInfo();
            cardInfo.setCardNumber("4111111111111111");
            cardInfo.setCvv("123");
            cardInfo.setExpMonth(12);
            cardInfo.setExpYear(2025);
            cardInfo.setBillingAddress("123 Main St");
            request.setCardInfo(cardInfo);

            // Process checkout
            CheckoutResult result = checkoutFacade.checkout(request);

            if (result.isSuccess()) {
                Booking booking = result.getBooking();
                Map<String, Object> totals = new HashMap<>();
                totals.put("subtotal", booking.getSubtotalCents() / 100.0);
                totals.put("serviceFee", booking.getFeesCents() / 100.0);
                totals.put("tax", booking.getTaxCents() / 100.0);
                totals.put("discount", booking.getDiscountCents() != null ? booking.getDiscountCents() / 100.0 : 0);
                totals.put("total", booking.getTotalCents() / 100.0);
                
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "orderId", booking.getId(),
                    "bookingId", booking.getId(),
                    "confirmationCode", booking.getBookingNumber(),
                    "bookingNumber", booking.getBookingNumber(),
                    "totals", totals
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", result.getErrorMessage()));
            }

        } catch (Exception e) {
            log.error("Checkout failed with error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "Checkout failed: " + e.getMessage()));
        }
    }

    /**
     * Get order history for a user.
     */
    @GetMapping("/checkout/orders")
    public ResponseEntity<Map<String, Object>> getOrderHistory(@RequestParam Long userId) {
        log.info("Getting order history for user: {}", userId);

        try {
            // Corrected SQL — includes discount_cents
            String sql = """
                SELECT b.id, b.booking_number, b.status, b.total_cents, b.created_at,
                       b.subtotal_cents, b.fees_cents, b.tax_cents, b.discount_cents, b.promo_code_id,
                       pc.code AS promo_code, p.name AS promo_name
                FROM bookings b
                LEFT JOIN promotion_codes pc ON b.promo_code_id = pc.id
                LEFT JOIN promotions p ON pc.promotion_id = p.id
                WHERE b.user_id = ?
                ORDER BY b.created_at DESC
                """;

            List<Map<String, Object>> bookings = jdbc.queryForList(sql, userId);

            List<Map<String, Object>> orders = new ArrayList<>();
            for (Map<String, Object> booking : bookings) {
                Long bookingId = ((Number) booking.get("id")).longValue();

                // Fetch tickets for this booking
                String ticketSql = """
                    SELECT t.ticket_number, CONCAT(se.row_label, se.seat_number) AS seat_label,
                           t.age_category, t.price_cents, m.title AS movie_title
                    FROM tickets t
                    JOIN showtimes s ON t.showtime_id = s.id
                    JOIN movies m ON s.movie_id = m.id
                    JOIN seats se ON t.seat_id = se.id
                    WHERE t.booking_id = ?
                    """;

                List<Map<String, Object>> tickets = jdbc.queryForList(ticketSql, bookingId);

                // Build order map
                Map<String, Object> order = new HashMap<>(booking);
                order.put("tickets", tickets);

                // Totals breakdown
                Map<String, Object> totals = new HashMap<>();
                int subtotalCents = ((Number) booking.get("subtotal_cents")).intValue();
                int feesCents = booking.get("fees_cents") != null ?
                    ((Number) booking.get("fees_cents")).intValue() : 0;
                int taxCents = booking.get("tax_cents") != null ?
                    ((Number) booking.get("tax_cents")).intValue() : 0;
                int discountCents = booking.get("discount_cents") != null ?
                    ((Number) booking.get("discount_cents")).intValue() : 0;
                int totalCents = ((Number) booking.get("total_cents")).intValue();
                
                totals.put("subtotal", subtotalCents / 100.0);
                totals.put("serviceFee", feesCents / 100.0);
                totals.put("tax", taxCents / 100.0);
                totals.put("discount", discountCents / 100.0);
                totals.put("total", totalCents / 100.0);
                totals.put("promoCodeId", booking.get("promo_code_id"));

                order.put("totals", totals);
                orders.add(order);
            }

            return ResponseEntity.ok(Map.of("ok", true, "orders", orders));

        } catch (Exception e) {
            log.error("Failed to get order history", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("ok", false, "message", "Failed to load order history"));
        }
    }

    /**
     * Confirm order draft.
     */
    @PostMapping("/orders/{orderId}/confirm")
    public ResponseEntity<Map<String, Object>> confirmOrder(@PathVariable String orderId, @RequestBody Map<String, Object> payload) {
        try {
            Long userId = payload.get("userId") != null ? ((Number) payload.get("userId")).longValue() : null;
            Long showId = payload.get("showId") != null ? ((Number) payload.get("showId")).longValue() : null;
            @SuppressWarnings("unchecked")
            List<Object> seatsList = (List<Object>) payload.get("seats");
            Long paymentMethodId = payload.get("paymentMethodId") != null ? ((Number) payload.get("paymentMethodId")).longValue() : null;

            if (userId == null || showId == null || seatsList == null || seatsList.isEmpty() || paymentMethodId == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Missing required fields"));
            }

            List<Long> seatIds = seatsList.stream().map(seat -> ((Number) seat).longValue()).collect(Collectors.toList());

            CheckoutRequest request = new CheckoutRequest();
            request.setUserId(userId);
            request.setShowtimeId(showId);

            List<CheckoutRequest.SeatSelection> seatSelections =
                seatIds.stream().map(id -> new CheckoutRequest.SeatSelection(id, "ADULT")).collect(Collectors.toList());
            request.setSelectedSeats(seatSelections);

            CheckoutRequest.CardInfo cardInfo = new CheckoutRequest.CardInfo();
            cardInfo.setCardNumber("4111111111111111");
            cardInfo.setCvv("123");
            cardInfo.setExpMonth(12);
            cardInfo.setExpYear(2025);
            cardInfo.setBillingAddress("123 Main St");
            request.setCardInfo(cardInfo);

            CheckoutResult result = checkoutFacade.checkout(request);

            String movieTitle = jdbc.queryForObject(
                "SELECT m.title FROM showtimes s JOIN movies m ON s.movie_id = m.id WHERE s.id = ?",
                String.class, showId);

            if (result.isSuccess()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "orderId", result.getBooking().getId(),
                    "confirmationCode", result.getBooking().getBookingNumber(),
                    "show", Map.of("id", showId, "title", movieTitle),
                    "seats", seatIds,
                    "totals", Map.of("subtotal", result.getBooking().getTotalCents() / 100.0)
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", result.getErrorMessage()));
            }

        } catch (Exception e) {
            log.error("Failed to confirm order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "Failed to confirm order: " + e.getMessage()));
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/checkout/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "service", "checkout",
            "timestamp", System.currentTimeMillis()
        ));
    }
}