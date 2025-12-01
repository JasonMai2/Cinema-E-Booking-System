package com.cinemae.booking.service;

import com.cinemae.booking.dto.CheckoutRequest;
import com.cinemae.booking.model.Booking;
import com.cinemae.booking.model.Ticket;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service for generating and managing tickets.
 * Generates tickets for confirmed bookings.
 */
@Service
public class TicketService {

    private static final Logger log = LoggerFactory.getLogger(TicketService.class);
    private final JdbcTemplate jdbc;

    @Autowired
    public TicketService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Generate tickets for a confirmed booking.
     * 
     * @param booking The confirmed booking
     * @return List of generated tickets
     */
    @Transactional
    public List<Ticket> generateTickets(Booking booking) {
        log.info("Generating tickets for booking {}", booking.getId());

        List<Ticket> tickets = new ArrayList<>();

        // Get booking details to determine showtime and seats
        // For now, we'll need the seat selections from the original request
        // In a real system, you'd store the seat selections in a booking_seats table
        // For this implementation, we'll create a simple version
        
        // This is a simplified version - in production you'd have a booking_seats junction table
        // that stores the relationship between bookings and seats
        
        return tickets;
    }

    /**
     * Generate tickets for a booking with explicit seat selections.
     * This is used directly from the checkout process.
     * 
     * @param booking The booking
     * @param showtimeId The showtime ID
     * @param selectedSeats The selected seats with age categories
     * @return List of generated tickets
     */
    @Transactional
    public List<Ticket> generateTickets(Booking booking, Long showtimeId, List<CheckoutRequest.SeatSelection> selectedSeats) {
        log.info("Generating {} tickets for booking {}", selectedSeats.size(), booking.getId());

        List<Ticket> tickets = new ArrayList<>();

        for (CheckoutRequest.SeatSelection seatSelection : selectedSeats) {
            String ticketNumber = generateTicketNumber();
            String ageCategory = seatSelection.getAgeCategory() != null ? 
                seatSelection.getAgeCategory().toUpperCase() : "ADULT";
            
            // Get price for this age category
            int priceCents = getPriceForCategory(showtimeId, ageCategory);

            // Insert ticket
            jdbc.update(
                "INSERT INTO tickets (ticket_number, booking_id, showtime_id, seat_id, age_category, price_cents) " +
                "VALUES (?, ?, ?, ?, ?, ?)",
                ticketNumber, booking.getId(), showtimeId, seatSelection.getSeatId(), 
                ageCategory, priceCents
            );

            Long ticketId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

            // Get additional info for the ticket
            Map<String, Object> ticketInfo = getTicketInfo(ticketId);

            Ticket ticket = new Ticket();
            ticket.setId(ticketId);
            ticket.setTicketNumber(ticketNumber);
            ticket.setBookingId(booking.getId());
            ticket.setShowtimeId(showtimeId);
            ticket.setSeatId(seatSelection.getSeatId());
            ticket.setAgeCategory(ageCategory);
            ticket.setPriceCents(priceCents);
            
            // Set display info
            ticket.setMovieTitle((String) ticketInfo.get("movie_title"));
            ticket.setAuditoriumName((String) ticketInfo.get("auditorium_name"));
            ticket.setSeatLabel((String) ticketInfo.get("seat_label"));
            ticket.setShowtimeStart(String.valueOf(ticketInfo.get("showtime_start")));

            tickets.add(ticket);
            
            log.info("Generated ticket {} for seat {} ({})", ticketNumber, seatSelection.getSeatId(), ageCategory);
        }

        return tickets;
    }

    /**
     * Generate a unique ticket number (16 characters).
     */
    private String generateTicketNumber() {
        return "TK" + UUID.randomUUID().toString().replace("-", "").substring(0, 14).toUpperCase();
    }

    /**
     * Get price for a specific age category and showtime.
     */
    private int getPriceForCategory(Long showtimeId, String ageCategory) {
        // Try showtime-specific pricing first
        List<Map<String, Object>> rules = jdbc.queryForList(
            "SELECT child_cents, adult_cents, senior_cents " +
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
                "SELECT child_cents, adult_cents, senior_cents " +
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
                "SELECT child_cents, adult_cents, senior_cents " +
                "FROM price_rules " +
                "WHERE scope = 'GLOBAL' AND active = TRUE " +
                "AND (effective_to IS NULL OR effective_to > NOW()) " +
                "ORDER BY effective_from DESC LIMIT 1"
            );
        }

        // Default prices if no rules found
        Map<String, Integer> defaultPrices = Map.of(
            "CHILD", 800,   // $8.00
            "ADULT", 1200,  // $12.00
            "SENIOR", 900   // $9.00
        );

        if (rules.isEmpty()) {
            return defaultPrices.getOrDefault(ageCategory, 1200);
        }

        Map<String, Object> rule = rules.get(0);
        return switch (ageCategory) {
            case "CHILD" -> (Integer) rule.get("child_cents");
            case "SENIOR" -> (Integer) rule.get("senior_cents");
            default -> (Integer) rule.get("adult_cents");
        };
    }

    /**
     * Get additional ticket information for display (movie title, auditorium, seat label, etc.).
     */
    private Map<String, Object> getTicketInfo(Long ticketId) {
        return jdbc.queryForMap(
            "SELECT m.title AS movie_title, a.name AS auditorium_name, " +
            "CONCAT(s.row_label, s.seat_number) AS seat_label, st.starts_at AS showtime_start " +
            "FROM tickets t " +
            "JOIN showtimes st ON t.showtime_id = st.id " +
            "JOIN movies m ON st.movie_id = m.id " +
            "JOIN seats s ON t.seat_id = s.id " +
            "JOIN auditoriums a ON s.auditorium_id = a.id " +
            "WHERE t.id = ?",
            ticketId
        );
    }
}
