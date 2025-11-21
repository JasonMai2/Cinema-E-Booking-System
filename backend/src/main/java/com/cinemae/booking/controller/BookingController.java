package com.cinemae.booking.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private JdbcTemplate jdbc;

    // Get all movies with showtimes
    @GetMapping("/movies")
    public Map<String, Object> getMoviesWithShowtimes() {
        try {
            // Get all active movies - using correct column names from actual database schema
            String movieSql = "SELECT id, title, synopsis, mpaa_rating, trailer_image_url FROM movies";
            List<Map<String, Object>> movies = jdbc.queryForList(movieSql);
            
            // Get showtimes for each movie
            for (Map<String, Object> movie : movies) {
                Long movieId = ((Number) movie.get("id")).longValue();
                String showtimeSql = """
                    SELECT s.id, s.starts_at, a.name as auditorium_name, a.seat_rows, a.seat_cols
                    FROM showtimes s
                    JOIN auditoriums a ON s.auditorium_id = a.id
                    WHERE s.movie_id = ? AND s.starts_at > NOW()
                    ORDER BY s.starts_at
                """;
                List<Map<String, Object>> showtimes = jdbc.queryForList(showtimeSql, movieId);
                movie.put("showtimes", showtimes);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("ok", true);
            response.put("movies", movies);
            return response;
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("ok", false);
            response.put("message", "Failed to load movies: " + e.getMessage());
            return response;
        }
    }

    // Get available seats for a showtime
    @GetMapping("/showtimes/{showtimeId}/seats")
    public Map<String, Object> getAvailableSeats(@PathVariable Long showtimeId) {
        try {
            // Get auditorium capacity and showtime details - using correct table and column names
            String showtimeSql = """
                SELECT s.id, s.starts_at, a.seat_rows, a.seat_cols, a.name as auditorium_name, a.id as auditorium_id, m.title as movie_title
                FROM showtimes s
                JOIN auditoriums a ON s.auditorium_id = a.id
                JOIN movies m ON s.movie_id = m.id
                WHERE s.id = ?
            """;
            
            List<Map<String, Object>> showtimeResults = jdbc.queryForList(showtimeSql, showtimeId);
            if (showtimeResults.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("ok", false);
                response.put("message", "Showtime not found with ID: " + showtimeId);
                return response;
            }
            
            Map<String, Object> showtime = showtimeResults.get(0);
            Integer seatRows = (Integer) showtime.get("seat_rows");
            Integer seatCols = (Integer) showtime.get("seat_cols");
            Integer auditoriumId = (Integer) showtime.get("auditorium_id");
            
            // Check if seats exist for this auditorium, if not create them
            ensureSeatsExist(auditoriumId, seatRows != null ? seatRows : 10, seatCols != null ? seatCols : 10);
            
            // Get booked seats - using correct table structure with tickets and seats
            String bookedSeatsSql = """
                SELECT CONCAT(s.row_label, s.seat_number) as seat_identifier
                FROM tickets t
                JOIN seats s ON t.seat_id = s.id
                JOIN bookings b ON t.booking_id = b.id
                WHERE t.showtime_id = ? AND b.status != 'CANCELLED'
            """;
            List<String> bookedSeats = jdbc.queryForList(bookedSeatsSql, String.class, showtimeId);
            
            // Generate seat map using rows and columns
            Map<String, Object> seatMap = generateSeatMap(seatRows, seatCols, bookedSeats);
            
            Map<String, Object> response = new HashMap<>();
            response.put("ok", true);
            response.put("showtime", showtime);
            response.put("seats", seatMap);
            response.put("bookedSeats", bookedSeats);
            return response;
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("ok", false);
            response.put("message", "Failed to load seats: " + e.getMessage());
            return response;
        }
    }

    // Create a booking
    @PostMapping("/create")
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> createBooking(@RequestBody Map<String, Object> payload) {
        try {
            // Extract booking data
            Long userId = ((Number) payload.get("userId")).longValue();
            Long showtimeId = ((Number) payload.get("showtimeId")).longValue();
            @SuppressWarnings("unchecked")
            List<String> selectedSeats = (List<String>) payload.get("selectedSeats");
            String promoCode = payload.get("promoCode") != null ? payload.get("promoCode").toString() : null;
            
            if (selectedSeats == null || selectedSeats.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("ok", false);
                response.put("message", "Please select at least one seat");
                return response;
            }
            
            // Check seat availability - using correct table structure
            for (String seatIdentifier : selectedSeats) {
                String checkSeatSql = """
                    SELECT COUNT(*) 
                    FROM tickets t
                    JOIN seats s ON t.seat_id = s.id
                    JOIN bookings b ON t.booking_id = b.id
                    WHERE t.showtime_id = ? AND CONCAT(s.row_label, s.seat_number) = ? AND b.status != 'CANCELLED'
                """;
                Integer count = jdbc.queryForObject(checkSeatSql, Integer.class, showtimeId, seatIdentifier);
                if (count != null && count > 0) {
                    Map<String, Object> response = new HashMap<>();
                    response.put("ok", false);
                    response.put("message", "Seat " + seatIdentifier + " is no longer available");
                    return response;
                }
            }
            
            // Get showtime details for pricing - using correct table structure
            String showtimeSql = """
                SELECT s.starts_at, m.title, a.name as auditorium_name
                FROM showtimes s
                JOIN movies m ON s.movie_id = m.id
                JOIN auditoriums a ON s.auditorium_id = a.id
                WHERE s.id = ?
            """;
            Map<String, Object> showtimeDetails = jdbc.queryForMap(showtimeSql, showtimeId);
            
            // For now, use a fixed ticket price since there's no price column in showtimes
            Double ticketPrice = 12.50; // Default ticket price
            
            // Calculate total price
            Double subtotal = ticketPrice * selectedSeats.size();
            Double discount = 0.0;
            
            // Apply promo code if provided
            if (promoCode != null && !promoCode.trim().isEmpty()) {
                String promoSql = """
                    SELECT discount_percentage 
                    FROM promotions 
                    WHERE code = ? AND start_date <= NOW() AND end_date >= NOW() AND is_active = true
                """;
                try {
                    Double discountPercentage = jdbc.queryForObject(promoSql, Double.class, promoCode.trim());
                    if (discountPercentage != null) {
                        discount = subtotal * (discountPercentage / 100);
                    }
                } catch (Exception e) {
                    // Promo code not found or expired - continue without discount
                }
            }
            
            Double total = subtotal - discount;
            
            // Generate unique booking number
            String bookingNumber = "BK" + System.currentTimeMillis();
            
            // Convert to cents for database storage
            int subtotalCents = (int) Math.round(subtotal * 100);
            int totalCents = (int) Math.round(total * 100);
            
            // Create main booking record
            String insertBookingSql = """
                INSERT INTO bookings (booking_number, user_id, status, subtotal_cents, total_cents, created_at)
                VALUES (?, ?, 'PENDING', ?, ?, NOW())
            """;
            
            jdbc.update(insertBookingSql, bookingNumber, userId, subtotalCents, totalCents);
            
            // Get the booking ID
            Long bookingId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            
            // Create tickets for each selected seat
            List<String> ticketNumbers = new ArrayList<>();
            for (String seatIdentifier : selectedSeats) {
                // Parse seat identifier (e.g., "A1" -> row "A", seat 1)
                String rowLabel = seatIdentifier.substring(0, 1);
                int seatNum = Integer.parseInt(seatIdentifier.substring(1));
                
                // Find the seat ID
                String findSeatSql = """
                    SELECT id FROM seats 
                    WHERE auditorium_id = (SELECT auditorium_id FROM showtimes WHERE id = ?) 
                    AND row_label = ? AND seat_number = ?
                """;
                Long seatId = jdbc.queryForObject(findSeatSql, Long.class, showtimeId, rowLabel, seatNum);
                
                if (seatId != null) {
                    // Generate unique ticket number
                    String ticketNumber = "TK" + System.currentTimeMillis() + seatId;
                    ticketNumbers.add(ticketNumber);
                    
                    // Insert ticket
                    String insertTicketSql = """
                        INSERT INTO tickets (ticket_number, booking_id, showtime_id, seat_id, age_category, price_cents)
                        VALUES (?, ?, ?, ?, 'ADULT', ?)
                    """;
                    int ticketPriceCents = (int) Math.round(ticketPrice * 100);
                    jdbc.update(insertTicketSql, ticketNumber, bookingId, showtimeId, seatId, ticketPriceCents);
                }
            }
            
            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("ok", true);
            response.put("message", "Booking created successfully");
            response.put("bookingId", bookingId);
            response.put("bookingNumber", bookingNumber);
            response.put("ticketNumbers", ticketNumbers);
            response.put("bookingDetails", Map.of(
                "movieTitle", showtimeDetails.get("title"),
                "auditoriumName", showtimeDetails.get("auditorium_name"),
                "showTime", showtimeDetails.get("starts_at"),
                "seats", selectedSeats,
                "ticketPrice", ticketPrice,
                "subtotal", subtotal,
                "discount", discount,
                "total", total
            ));
            
            return response;
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("ok", false);
            response.put("message", "Failed to create booking: " + e.getMessage());
            return response;
        }
    }

    // Get user's bookings
    @GetMapping("/user/{userId}")
    public Map<String, Object> getUserBookings(@PathVariable Long userId) {
        try {
            String sql = """
                SELECT b.id, b.booking_number, b.status, b.created_at, b.total_cents,
                       m.title as movie_title, m.trailer_image_url, s.starts_at, a.name as auditorium_name,
                       GROUP_CONCAT(CONCAT(st.row_label, st.seat_number)) as seat_numbers
                FROM bookings b
                JOIN tickets t ON b.id = t.booking_id
                JOIN showtimes s ON t.showtime_id = s.id
                JOIN movies m ON s.movie_id = m.id
                JOIN auditoriums a ON s.auditorium_id = a.id
                JOIN seats st ON t.seat_id = st.id
                WHERE b.user_id = ?
                GROUP BY b.id, b.booking_number, b.status, b.created_at, b.total_cents, m.title, m.trailer_image_url, s.starts_at, a.name
                ORDER BY b.created_at DESC
            """;
            
            List<Map<String, Object>> bookings = jdbc.queryForList(sql, userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("ok", true);
            response.put("bookings", bookings);
            return response;
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("ok", false);
            response.put("message", "Failed to load bookings: " + e.getMessage());
            return response;
        }
    }

    // Cancel a booking
    @PostMapping("/{bookingId}/cancel")
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> cancelBooking(@PathVariable Long bookingId, @RequestBody Map<String, Object> payload) {
        try {
            Long userId = ((Number) payload.get("userId")).longValue();
            
            // Verify booking belongs to user and is cancellable
            String checkSql = """
                SELECT b.status, s.starts_at
                FROM bookings b
                JOIN tickets t ON b.id = t.booking_id
                JOIN showtimes s ON t.showtime_id = s.id
                WHERE b.id = ? AND b.user_id = ?
                LIMIT 1
            """;
            
            Map<String, Object> booking = jdbc.queryForMap(checkSql, bookingId, userId);
            String status = booking.get("status").toString();
            Timestamp showTime = (Timestamp) booking.get("starts_at");
            
            if (!"PENDING".equals(status) && !"PAID".equals(status)) {
                Map<String, Object> response = new HashMap<>();
                response.put("ok", false);
                response.put("message", "This booking cannot be cancelled");
                return response;
            }
            
            // Check if show time is more than 2 hours away
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime showDateTime = showTime.toLocalDateTime();
            if (showDateTime.isBefore(now.plusHours(2))) {
                Map<String, Object> response = new HashMap<>();
                response.put("ok", false);
                response.put("message", "Bookings cannot be cancelled less than 2 hours before showtime");
                return response;
            }
            
            // Cancel the booking
            String cancelSql = "UPDATE bookings SET status = 'cancelled' WHERE id = ?";
            jdbc.update(cancelSql, bookingId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("ok", true);
            response.put("message", "Booking cancelled successfully");
            return response;
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("ok", false);
            response.put("message", "Failed to cancel booking: " + e.getMessage());
            return response;
        }
    }

    // Helper method to ensure seats exist for an auditorium
    private void ensureSeatsExist(Integer auditoriumId, int seatRows, int seatCols) {
        // Check if seats already exist for this auditorium
        String checkSeatsSql = "SELECT COUNT(*) FROM seats WHERE auditorium_id = ?";
        Integer seatCount = jdbc.queryForObject(checkSeatsSql, Integer.class, auditoriumId);
        
        if (seatCount == null || seatCount == 0) {
            // Create seats for this auditorium
            String insertSeatSql = "INSERT INTO seats (auditorium_id, row_label, seat_number, seat_type) VALUES (?, ?, ?, 'STANDARD')";
            
            for (int row = 0; row < seatRows; row++) {
                char rowLabel = (char) ('A' + row);
                for (int seat = 1; seat <= seatCols; seat++) {
                    jdbc.update(insertSeatSql, auditoriumId, String.valueOf(rowLabel), seat);
                }
            }
        }
    }

    // Helper method to generate seat map
    private Map<String, Object> generateSeatMap(Integer seatRows, Integer seatCols, List<String> bookedSeats) {
        Map<String, Object> seatMap = new HashMap<>();
        List<Map<String, Object>> seats = new ArrayList<>();
        
        // Use actual rows and columns from auditorium
        int numRows = seatRows != null ? seatRows : 10;
        int seatsPerRow = seatCols != null ? seatCols : 10;
        int totalCapacity = numRows * seatsPerRow;
        
        for (int row = 0; row < numRows; row++) {
            char rowLetter = (char) ('A' + row);
            for (int seat = 1; seat <= seatsPerRow; seat++) {
                String seatNumber = rowLetter + String.valueOf(seat);
                Map<String, Object> seatInfo = new HashMap<>();
                seatInfo.put("number", seatNumber);
                seatInfo.put("row", String.valueOf(rowLetter));
                seatInfo.put("seat", seat);
                seatInfo.put("available", !bookedSeats.contains(seatNumber));
                seats.add(seatInfo);
            }
        }
        
        seatMap.put("seats", seats);
        seatMap.put("rows", numRows);
        seatMap.put("seatsPerRow", seatsPerRow);
        seatMap.put("capacity", totalCapacity);
        return seatMap;
    }

    // ============= ADMIN ENDPOINTS =============
    
    @PostMapping("/admin/auditoriums")
    public Map<String, Object> createAuditorium(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String name = (String) request.get("name");
            Integer seatRows = (Integer) request.get("seatRows");
            Integer seatCols = (Integer) request.get("seatCols");
            
            if (name == null || seatRows == null || seatCols == null) {
                response.put("ok", false);
                response.put("message", "Missing required fields: name, seatRows, seatCols");
                return response;
            }
            
            String sql = "INSERT INTO auditoriums (name, seat_rows, seat_cols) VALUES (?, ?, ?)";
            jdbc.update(sql, name, seatRows, seatCols);
            
            response.put("ok", true);
            response.put("message", "Auditorium created successfully");
            return response;
            
        } catch (Exception e) {
            response.put("ok", false);
            response.put("message", "Failed to create auditorium: " + e.getMessage());
            return response;
        }
    }
    
    @GetMapping("/admin/auditoriums")
    public Map<String, Object> getAuditoriums() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String sql = "SELECT id, name, seat_rows, seat_cols FROM auditoriums ORDER BY name";
            List<Map<String, Object>> auditoriums = jdbc.queryForList(sql);
            
            response.put("ok", true);
            response.put("auditoriums", auditoriums);
            return response;
            
        } catch (Exception e) {
            response.put("ok", false);
            response.put("message", "Failed to load auditoriums: " + e.getMessage());
            return response;
        }
    }
    
    @DeleteMapping("/admin/auditoriums/{auditoriumId}")
    public Map<String, Object> deleteAuditorium(@PathVariable Integer auditoriumId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Check if auditorium has any showtimes
            String checkShowtimesSql = "SELECT COUNT(*) FROM showtimes WHERE auditorium_id = ?";
            Integer showtimeCount = jdbc.queryForObject(checkShowtimesSql, Integer.class, auditoriumId);
            
            if (showtimeCount != null && showtimeCount > 0) {
                response.put("ok", false);
                response.put("message", "Cannot delete auditorium with existing showtimes. Please delete the showtimes first.");
                return response;
            }
            
            // Delete associated seats first
            String deleteSeatsSql = "DELETE FROM seats WHERE auditorium_id = ?";
            jdbc.update(deleteSeatsSql, auditoriumId);
            
            // Delete auditorium
            String deleteAuditoriumSql = "DELETE FROM auditoriums WHERE id = ?";
            int deletedRows = jdbc.update(deleteAuditoriumSql, auditoriumId);
            
            if (deletedRows == 0) {
                response.put("ok", false);
                response.put("message", "Auditorium not found");
                return response;
            }
            
            response.put("ok", true);
            response.put("message", "Auditorium deleted successfully");
            return response;
            
        } catch (Exception e) {
            response.put("ok", false);
            response.put("message", "Failed to delete auditorium: " + e.getMessage());
            return response;
        }
    }
    
    @PostMapping("/admin/showtimes")
    public Map<String, Object> createShowtime(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Integer movieId = (Integer) request.get("movieId");
            Integer auditoriumId = (Integer) request.get("auditoriumId");
            String startsAt = (String) request.get("startsAt");
            
            if (movieId == null || auditoriumId == null || startsAt == null) {
                response.put("ok", false);
                response.put("message", "Missing required fields: movieId, auditoriumId, startsAt");
                return response;
            }
            
            // Validate movie exists
            String movieCheck = "SELECT COUNT(*) FROM movies WHERE id = ?";
            Integer movieCount = jdbc.queryForObject(movieCheck, Integer.class, movieId);
            if (movieCount == null || movieCount == 0) {
                response.put("ok", false);
                response.put("message", "Movie with ID " + movieId + " not found");
                return response;
            }
            
            // Validate auditorium exists
            String auditoriumCheck = "SELECT COUNT(*) FROM auditoriums WHERE id = ?";
            Integer auditoriumCount = jdbc.queryForObject(auditoriumCheck, Integer.class, auditoriumId);
            if (auditoriumCount == null || auditoriumCount == 0) {
                response.put("ok", false);
                response.put("message", "Auditorium with ID " + auditoriumId + " not found");
                return response;
            }
            
            // Insert into showtimes table
            String sql = "INSERT INTO showtimes (movie_id, auditorium_id, starts_at) VALUES (?, ?, ?)";
            jdbc.update(sql, movieId, auditoriumId, startsAt);
            
            response.put("ok", true);
            response.put("message", "Showtime created successfully");
            return response;
            
        } catch (Exception e) {
            response.put("ok", false);
            response.put("message", "Failed to create showtime: " + e.getMessage());
            return response;
        }
    }
    
    @GetMapping("/admin/showtimes")
    public Map<String, Object> getAllShowtimes() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String sql = """
                SELECT s.id, s.movie_id, s.auditorium_id, s.starts_at,
                       m.title as movie_title, a.name as auditorium_name
                FROM showtimes s
                JOIN movies m ON s.movie_id = m.id
                JOIN auditoriums a ON s.auditorium_id = a.id
                ORDER BY s.starts_at DESC
                """;
            List<Map<String, Object>> showtimes = jdbc.queryForList(sql);
            
            response.put("ok", true);
            response.put("showtimes", showtimes);
            return response;
            
        } catch (Exception e) {
            response.put("ok", false);
            response.put("message", "Failed to load showtimes: " + e.getMessage());
            return response;
        }
    }
    
    @GetMapping("/admin/movies")
    public Map<String, Object> getMoviesForAdmin() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String sql = "SELECT id, title, status FROM movies ORDER BY title";
            List<Map<String, Object>> movies = jdbc.queryForList(sql);
            
            response.put("ok", true);
            response.put("movies", movies);
            return response;
            
        } catch (Exception e) {
            response.put("ok", false);
            response.put("message", "Failed to load movies: " + e.getMessage());
            return response;
        }
    }
    
    @DeleteMapping("/admin/showtimes/{showtimeId}")
    public Map<String, Object> deleteShowtime(@PathVariable Long showtimeId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Check if showtime has bookings (through tickets)
            String bookingCheck = "SELECT COUNT(*) FROM tickets WHERE showtime_id = ?";
            Integer bookingCount = jdbc.queryForObject(bookingCheck, Integer.class, showtimeId);
            
            if (bookingCount != null && bookingCount > 0) {
                response.put("ok", false);
                response.put("message", "Cannot delete showtime with existing bookings");
                return response;
            }
            
            String sql = "DELETE FROM showtimes WHERE id = ?";
            int rowsAffected = jdbc.update(sql, showtimeId);
            
            if (rowsAffected > 0) {
                response.put("ok", true);
                response.put("message", "Showtime deleted successfully");
            } else {
                response.put("ok", false);
                response.put("message", "Showtime not found");
            }
            
            return response;
            
        } catch (Exception e) {
            response.put("ok", false);
            response.put("message", "Failed to delete showtime: " + e.getMessage());
            return response;
        }
    }
}