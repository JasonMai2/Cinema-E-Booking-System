package com.cinemae.booking.controller;

import com.cinemae.booking.dto.CheckoutRequest;
import com.cinemae.booking.dto.CheckoutResult;
import com.cinemae.booking.facade.CheckoutFacade;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * REST Controller for the checkout process.
 * This controller exposes the checkout endpoint and delegates to the CheckoutFacade.
 */
@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private static final Logger log = LoggerFactory.getLogger(CheckoutController.class);

    private final CheckoutFacade checkoutFacade;

    @Autowired
    public CheckoutController(CheckoutFacade checkoutFacade) {
        this.checkoutFacade = checkoutFacade;
    }

    /**
     * Process checkout for a booking.
     * 
     * @param request The checkout request containing user, showtime, seats, and payment info
     * @return ResponseEntity with checkout result
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> checkout(@RequestBody CheckoutRequest request) {
        log.info("Checkout request received for user {}", request.getUserId());

        // Validate request
        if (request.getUserId() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "User ID is required"
            ));
        }

        if (request.getShowtimeId() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Showtime ID is required"
            ));
        }

        if (request.getSelectedSeats() == null || request.getSelectedSeats().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "At least one seat must be selected"
            ));
        }

        if (request.getCardInfo() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Payment information is required"
            ));
        }

        // Process checkout through facade
        CheckoutResult result = checkoutFacade.checkout(request);

        // Build response
        Map<String, Object> response = new HashMap<>();
        response.put("success", result.isSuccess());
        response.put("message", result.getMessage());

        if (result.isSuccess()) {
            // Success response with booking and tickets
            response.put("booking", Map.of(
                "id", result.getBooking().getId(),
                "bookingNumber", result.getBooking().getBookingNumber(),
                "status", result.getBooking().getStatus(),
                "totalCents", result.getBooking().getTotalCents(),
                "subtotalCents", result.getBooking().getSubtotalCents(),
                "feesCents", result.getBooking().getFeesCents(),
                "taxCents", result.getBooking().getTaxCents()
            ));

            response.put("tickets", result.getTickets().stream().map(ticket -> Map.of(
                "id", ticket.getId(),
                "ticketNumber", ticket.getTicketNumber(),
                "movieTitle", ticket.getMovieTitle() != null ? ticket.getMovieTitle() : "",
                "auditorium", ticket.getAuditoriumName() != null ? ticket.getAuditoriumName() : "",
                "seat", ticket.getSeatLabel() != null ? ticket.getSeatLabel() : "",
                "ageCategory", ticket.getAgeCategory(),
                "priceCents", ticket.getPriceCents(),
                "showtime", ticket.getShowtimeStart() != null ? ticket.getShowtimeStart() : ""
            )).toList());

            // Include promotion info if applied
            if (result.getPromotionApplied() != null) {
                response.put("promotionApplied", result.getPromotionApplied());
            }

            log.info("Checkout successful for booking {}", result.getBooking().getBookingNumber());
            return ResponseEntity.ok(response);

        } else {
            // Failure response with error
            response.put("error", result.getErrorMessage());
            log.warn("Checkout failed: {}", result.getErrorMessage());
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(response);
        }
    }

    /**
     * Health check endpoint to verify the checkout service is running.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "service", "checkout",
            "timestamp", System.currentTimeMillis()
        ));
    }
}
