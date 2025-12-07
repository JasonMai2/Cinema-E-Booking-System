package com.cinemae.booking.service;

import java.util.ArrayList;
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
import com.cinemae.booking.model.Ticket;

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
            // Store ticket type name (lowercase for consistency)
            String ticketType = seatSelection.getAgeCategory() != null ? 
                seatSelection.getAgeCategory().toLowerCase() : "adult";
            
            // Get price for this ticket type
            int priceCents = getPriceForCategory(showtimeId, ticketType);

            // Insert ticket with all required fields
            jdbc.update(
                "INSERT INTO tickets (ticket_number, booking_id, showtime_id, seat_id, age_category, price_cents) " +
                "VALUES (?, ?, ?, ?, ?, ?)",
                ticketNumber, booking.getId(), showtimeId, seatSelection.getSeatId(), ticketType, priceCents
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
            ticket.setAgeCategory(ticketType);
            ticket.setPriceCents(priceCents);
            
            // Set display info
            ticket.setMovieTitle((String) ticketInfo.get("movie_title"));
            ticket.setAuditoriumName((String) ticketInfo.get("auditorium_name"));
            ticket.setSeatLabel((String) ticketInfo.get("seat_label"));
            ticket.setShowtimeStart(String.valueOf(ticketInfo.get("showtime_start")));

            tickets.add(ticket);
            
            log.info("Generated ticket {} for seat {} ({})", ticketNumber, seatSelection.getSeatId(), ticketType);
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
     * Get price for a specific ticket type from ticket_types table.
     */
    private int getPriceForCategory(Long showtimeId, String ticketType) {
        // Get price from ticket_types table by name
        try {
            Integer price = jdbc.queryForObject(
                "SELECT price_cents FROM ticket_types WHERE LOWER(name) = ? AND is_active = 1 LIMIT 1",
                Integer.class,
                ticketType.toLowerCase()
            );
            
            if (price != null) {
                log.debug("Found price for {}: {} cents", ticketType, price);
                return price;
            }
        } catch (Exception e) {
            log.warn("Could not find price for ticket type '{}' in database, using fallback", ticketType);
        }

        // Fallback to default prices if ticket type not found in database
        Map<String, Integer> defaultPrices = Map.of(
            "child", 900,     // $9.00
            "adult", 1500,    // $15.00
            "senior", 1100    // $11.00
        );

        return defaultPrices.getOrDefault(ticketType.toLowerCase(), 1500);
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