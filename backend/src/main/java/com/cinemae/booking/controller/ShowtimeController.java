package com.cinemae.booking.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class ShowtimeController {

    private final JdbcTemplate jdbc;

    public ShowtimeController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Get all showtimes for a specific movie
     * GET /api/movies/{movieId}/shows
     */
    @GetMapping("/movies/{movieId}/shows")
    public Map<String, Object> getShowsForMovie(@PathVariable("movieId") Long movieId) {
        Map<String, Object> resp = new HashMap<>();
        
        try {
            String sql = """
                SELECT s.id, s.starts_at, s.movie_id, s.auditorium_id,
                       a.name as auditorium_name,
                       m.title as movie_title,
                       TIMESTAMPDIFF(MINUTE, NOW(), s.starts_at) as minutes_until_start
                FROM showtimes s
                JOIN auditoriums a ON s.auditorium_id = a.id
                JOIN movies m ON s.movie_id = m.id
                WHERE s.movie_id = ?
                AND s.starts_at >= NOW()
                ORDER BY s.starts_at ASC
                """;
            
            List<Map<String, Object>> shows = jdbc.queryForList(sql, movieId);
            
            // Format the response
            List<Map<String, Object>> formattedShows = new ArrayList<>();
            for (Map<String, Object> show : shows) {
                Map<String, Object> formatted = new LinkedHashMap<>();
                formatted.put("id", show.get("id"));
                formatted.put("startTime", show.get("starts_at"));
                formatted.put("movieId", show.get("movie_id"));
                formatted.put("auditorium", show.get("auditorium_name"));
                formatted.put("auditoriumId", show.get("auditorium_id"));
                formatted.put("movieTitle", show.get("movie_title"));
                formattedShows.add(formatted);
            }
            
            resp.put("ok", true);
            resp.put("shows", formattedShows);
            return resp;
            
        } catch (Exception e) {
            resp.put("ok", false);
            resp.put("message", "Failed to fetch shows: " + e.getMessage());
            return resp;
        }
    }

    /**
     * Get a single showtime details
     * GET /api/shows/{showId}
     */
    @GetMapping("/shows/{showId}")
    public Map<String, Object> getShow(@PathVariable("showId") String showId) {
        Map<String, Object> resp = new HashMap<>();
        
        try {
            // Handle demo show IDs
            if (showId.startsWith("demo-show-")) {
                Map<String, Object> demoShow = new LinkedHashMap<>();
                demoShow.put("id", showId);
                demoShow.put("title", "Demo Movie Show");
                demoShow.put("startTime", new Date());
                demoShow.put("auditorium", "Demo Auditorium");
                resp.put("ok", true);
                resp.put("show", demoShow);
                return resp;
            }
            
            // Parse showId as Long for database queries
            Long numericShowId;
            try {
                numericShowId = Long.parseLong(showId);
            } catch (NumberFormatException e) {
                resp.put("ok", false);
                resp.put("message", "Invalid show ID format");
                return resp;
            }
            
            String sql = """
                SELECT s.id, s.starts_at, s.movie_id, s.auditorium_id,
                       a.name as auditorium_name,
                       m.title as movie_title
                FROM showtimes s
                JOIN auditoriums a ON s.auditorium_id = a.id
                JOIN movies m ON s.movie_id = m.id
                WHERE s.id = ?
                """;
            
            List<Map<String, Object>> shows = jdbc.queryForList(sql, numericShowId);
            
            if (shows.isEmpty()) {
                resp.put("ok", false);
                resp.put("message", "Showtime not found");
                return resp;
            }
            
            Map<String, Object> show = shows.get(0);
            Map<String, Object> formatted = new LinkedHashMap<>();
            formatted.put("id", show.get("id"));
            formatted.put("startTime", show.get("starts_at"));
            formatted.put("movieId", show.get("movie_id"));
            formatted.put("auditorium", show.get("auditorium_name"));
            formatted.put("auditoriumId", show.get("auditorium_id"));
            formatted.put("title", show.get("movie_title"));
            
            resp.put("ok", true);
            resp.put("show", formatted);
            return resp;
            
        } catch (Exception e) {
            resp.put("ok", false);
            resp.put("message", "Failed to fetch show: " + e.getMessage());
            return resp;
        }
    }

    /**
     * GET /api/shows/{showId}/seats
     */
    @GetMapping("/shows/{showId}/seats")
    public Map<String, Object> getSeatMap(@PathVariable("showId") String showId) {
        Map<String, Object> resp = new HashMap<>();
        
        try {
            // Handle demo show IDs
            if (showId.startsWith("demo-show-")) {
                return getDemoSeatMap(showId);
            }
            
            // Parse showId as Long for database queries
            Long numericShowId;
            try {
                numericShowId = Long.parseLong(showId);
            } catch (NumberFormatException e) {
                resp.put("ok", false);
                resp.put("message", "Invalid show ID format");
                return resp;
            }
            
            // First verify the showtime exists
            String checkSql = "SELECT id, auditorium_id FROM showtimes WHERE id = ?";
            List<Map<String, Object>> showtimes = jdbc.queryForList(checkSql, numericShowId);
            
            if (showtimes.isEmpty()) {
                resp.put("ok", false);
                resp.put("message", "Showtime not found");
                return resp;
            }
            
            Long auditoriumId = ((Number) showtimes.get(0).get("auditorium_id")).longValue();
            
            // Get all seats for this auditorium
            String seatsSql = "SELECT s.id, s.row_label, s.seat_number, s.seat_type, " +
                "CASE " +
                "  WHEN EXISTS (" +
                "    SELECT 1 FROM tickets t " +
                "    JOIN bookings b ON t.booking_id = b.id " +
                "    WHERE t.showtime_id = ? AND t.seat_id = s.id " +
                "    AND b.status IN ('CONFIRMED', 'PAID', 'PENDING')" +
                "  ) THEN 'booked' " +
                "  WHEN EXISTS (" +
                "    SELECT 1 FROM seat_locks sl " +
                "    WHERE sl.showtime_id = ? AND sl.seat_id = s.id " +
                "    AND sl.expires_at > NOW()" +
                "  ) THEN 'locked' " +
                "  ELSE 'available' " +
                "END as status " +
                "FROM seats s " +
                "WHERE s.auditorium_id = ? " +
                "ORDER BY s.row_label, s.seat_number";
            
            List<Map<String, Object>> seats = jdbc.queryForList(seatsSql, numericShowId, numericShowId, auditoriumId);
            
            // Get pricing for this showtime
            String priceSql = """
                SELECT adult_cents, child_cents, senior_cents, booking_fee_cents
                FROM price_rules
                WHERE active = true
                  AND effective_from <= NOW()
                  AND (effective_to IS NULL OR effective_to >= NOW())
                  AND (
                    (scope = 'SHOWTIME' AND showtime_id = ?)
                    OR (scope = 'MOVIE' AND movie_id = (SELECT movie_id FROM showtimes WHERE id = ?))
                    OR (scope = 'GLOBAL' AND showtime_id IS NULL)
                  )
                ORDER BY scope DESC, effective_from DESC
                LIMIT 1
                """;
            
            List<Map<String, Object>> prices = jdbc.queryForList(priceSql, numericShowId, numericShowId);
            int adultCents = 1000; // default $10
            int childCents = 500;  // default $5
            int seniorCents = 800; // default $8
            
            if (!prices.isEmpty()) {
                adultCents = ((Number) prices.get(0).get("adult_cents")).intValue();
                childCents = ((Number) prices.get(0).get("child_cents")).intValue();
                seniorCents = ((Number) prices.get(0).get("senior_cents")).intValue();
            }
            
            // Format seats for frontend
            List<Map<String, Object>> formattedSeats = new ArrayList<>();
            for (Map<String, Object> seat : seats) {
                Map<String, Object> formatted = new LinkedHashMap<>();
                formatted.put("id", seat.get("id"));
                formatted.put("row", seat.get("row_label"));
                formatted.put("number", seat.get("seat_number"));
                formatted.put("status", seat.get("status"));
                formatted.put("price", adultCents / 100.0); // Convert cents to dollars
                formatted.put("type", seat.get("seat_type"));
                formattedSeats.add(formatted);
            }
            
            resp.put("ok", true);
            resp.put("seats", formattedSeats);
            resp.put("pricing", Map.of(
                "adult", adultCents / 100.0,
                "child", childCents / 100.0,
                "senior", seniorCents / 100.0
            ));
            return resp;
            
        } catch (Exception e) {
            resp.put("ok", false);
            resp.put("message", "Failed to fetch seat map: " + e.getMessage());
            return resp;
        }
    }

    /**
     * Reserve seats for a showtime (creates seat locks)
     * POST /api/shows/{showId}/reserve
     */
    @PostMapping("/shows/{showId}/reserve")
    public Map<String, Object> reserveSeats(
            @PathVariable("showId") String showId,
            @RequestBody Map<String, Object> body) {
        
        Map<String, Object> resp = new HashMap<>();
        
        try {
            // Handle demo show IDs
            if (showId.startsWith("demo-show-")) {
                return reserveDemoSeats(showId, body);
            }
            
            // Parse showId as Long for database queries
            Long numericShowId;
            try {
                numericShowId = Long.parseLong(showId);
            } catch (NumberFormatException e) {
                resp.put("ok", false);
                resp.put("message", "Invalid show ID format");
                return resp;
            }
            
            @SuppressWarnings("unchecked")
            List<Object> seatIds = (List<Object>) body.get("seats");
            
            if (seatIds == null || seatIds.isEmpty()) {
                resp.put("ok", false);
                resp.put("message", "No seats provided");
                return resp;
            }
            
            // Check if seats are available
            for (Object seatIdObj : seatIds) {
                Long seatId = ((Number) seatIdObj).longValue();
                
                String checkSql = """
                    SELECT COUNT(*) as cnt FROM tickets t
                    JOIN bookings b ON t.booking_id = b.id
                    WHERE t.showtime_id = ? AND t.seat_id = ?
                    AND b.status IN ('CONFIRMED', 'PAID', 'PENDING')
                    """;
                
                Integer count = jdbc.queryForObject(checkSql, Integer.class, numericShowId, seatId);
                if (count != null && count > 0) {
                    resp.put("ok", false);
                    resp.put("message", "Seat " + seatId + " is already booked");
                    return resp;
                }
                
                // Check for active locks
                String lockCheckSql = """
                    SELECT COUNT(*) as cnt FROM seat_locks
                    WHERE showtime_id = ? AND seat_id = ?
                    AND expires_at > NOW()
                    """;
                
                Integer lockCount = jdbc.queryForObject(lockCheckSql, Integer.class, numericShowId, seatId);
                if (lockCount != null && lockCount > 0) {
                    resp.put("ok", false);
                    resp.put("message", "Seat " + seatId + " is temporarily locked by another user");
                    return resp;
                }
            }
            
            // Create locks for 10 minutes
            String lockSql = """
                INSERT INTO seat_locks (showtime_id, seat_id, expires_at, locked_at)
                VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW())
                """;
            
            for (Object seatIdObj : seatIds) {
                Long seatId = ((Number) seatIdObj).longValue();
                jdbc.update(lockSql, numericShowId, seatId);
            }
            
            resp.put("ok", true);
            resp.put("message", "Seats reserved for 10 minutes");
            resp.put("reservationId", "RES-" + System.currentTimeMillis());
            resp.put("expiresAt", new Date(System.currentTimeMillis() + 600000)); // 10 minutes
            return resp;
            
        } catch (Exception e) {
            resp.put("ok", false);
            resp.put("message", "Failed to reserve seats: " + e.getMessage());
            return resp;
        }
    }

    /**
     * Generate demo seat map for demo showtimes
     */
    private Map<String, Object> getDemoSeatMap(String showId) {
        Map<String, Object> resp = new HashMap<>();
        
        List<Map<String, Object>> seats = new ArrayList<>();
        
        // Generate a 10x10 grid of seats
        String[] rows = {"A", "B", "C", "D", "E", "F", "G", "H", "I", "J"};
        
        for (int row = 0; row < rows.length; row++) {
            for (int col = 1; col <= 10; col++) {
                Map<String, Object> seat = new LinkedHashMap<>();
                seat.put("id", rows[row] + col);
                seat.put("row", rows[row]);
                seat.put("number", col);
                seat.put("type", "standard");
                seat.put("price", 15.0); // Add price for demo seats
                
                // Randomly mark some seats as booked for demo purposes
                if (Math.random() < 0.3) {
                    seat.put("status", "booked");
                } else {
                    seat.put("status", "available");
                }
                
                seats.add(seat);
            }
        }
        
        // Add pricing info
        Map<String, Object> pricing = new LinkedHashMap<>();
        pricing.put("adultCents", 1500); // $15.00
        pricing.put("childCents", 1200); // $12.00
        pricing.put("seniorCents", 1000); // $10.00
        pricing.put("bookingFeeCents", 200); // $2.00
        
        resp.put("seats", seats);
        resp.put("pricing", pricing);
        resp.put("ok", true);
        
        return resp;
    }

    /**
     * Reserve demo seats (no-op for demo)
     */
    private Map<String, Object> reserveDemoSeats(String showId, Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        
        @SuppressWarnings("unchecked")
        List<Object> seatIds = (List<Object>) body.get("seats");
        
        if (seatIds == null || seatIds.isEmpty()) {
            resp.put("ok", false);
            resp.put("message", "No seats provided");
            return resp;
        }
        
        // For demo, just return success
        resp.put("ok", true);
        resp.put("message", "Demo seats reserved for 10 minutes");
        resp.put("reservationId", "DEMO-RES-" + System.currentTimeMillis());
        resp.put("expiresAt", new Date(System.currentTimeMillis() + 600000)); // 10 minutes
        
        return resp;
    }
}
