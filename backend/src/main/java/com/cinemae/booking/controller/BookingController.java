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
            // Get all active movies
            String movieSql = "SELECT id, title, genre, rating, duration, poster_url, trailer_url, description, status FROM movies WHERE status = 'active'";
            List<Map<String, Object>> movies = jdbc.queryForList(movieSql);
            
            // Get showtimes for each movie
            for (Map<String, Object> movie : movies) {
                Long movieId = ((Number) movie.get("id")).longValue();
                String showtimeSql = """
                    SELECT s.id, s.show_time, s.price, t.name as theater_name, t.capacity
                    FROM showtimes s
                    JOIN theaters t ON s.theater_id = t.id
                    WHERE s.movie_id = ? AND s.show_time > NOW()
                    ORDER BY s.show_time
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
            // Get theater capacity and showtime details
            String showtimeSql = """
                SELECT s.id, s.show_time, s.price, t.capacity, t.name as theater_name, m.title as movie_title
                FROM showtimes s
                JOIN theaters t ON s.theater_id = t.id
                JOIN movies m ON s.movie_id = m.id
                WHERE s.id = ?
            """;
            Map<String, Object> showtime = jdbc.queryForMap(showtimeSql, showtimeId);
            Integer capacity = (Integer) showtime.get("capacity");
            
            // Get booked seats
            String bookedSeatsSql = """
                SELECT seat_number 
                FROM bookings 
                WHERE showtime_id = ? AND status != 'cancelled'
            """;
            List<String> bookedSeats = jdbc.queryForList(bookedSeatsSql, String.class, showtimeId);
            
            // Generate seat map
            Map<String, Object> seatMap = generateSeatMap(capacity, bookedSeats);
            
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
            
            // Verify seats are available
            for (String seat : selectedSeats) {
                String checkSeatSql = """
                    SELECT COUNT(*) 
                    FROM bookings 
                    WHERE showtime_id = ? AND seat_number = ? AND status != 'cancelled'
                """;
                Integer count = jdbc.queryForObject(checkSeatSql, Integer.class, showtimeId, seat);
                if (count > 0) {
                    Map<String, Object> response = new HashMap<>();
                    response.put("ok", false);
                    response.put("message", "Seat " + seat + " is no longer available");
                    return response;
                }
            }
            
            // Get showtime details for pricing
            String showtimeSql = """
                SELECT s.price, s.show_time, m.title, t.name as theater_name
                FROM showtimes s
                JOIN movies m ON s.movie_id = m.id
                JOIN theaters t ON s.theater_id = t.id
                WHERE s.id = ?
            """;
            Map<String, Object> showtimeDetails = jdbc.queryForMap(showtimeSql, showtimeId);
            Double ticketPrice = Double.valueOf(showtimeDetails.get("price").toString());
            
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
                    discount = subtotal * (discountPercentage / 100);
                } catch (Exception e) {
                    // Promo code not found or expired - continue without discount
                }
            }
            
            Double total = subtotal - discount;
            
            // Create booking records
            String insertBookingSql = """
                INSERT INTO bookings (user_id, showtime_id, seat_number, ticket_price, status, booking_time, promo_code, discount_amount, total_amount)
                VALUES (?, ?, ?, ?, 'pending', NOW(), ?, ?, ?)
            """;
            
            List<Long> bookingIds = new ArrayList<>();
            for (String seat : selectedSeats) {
                jdbc.update(insertBookingSql, userId, showtimeId, seat, ticketPrice, promoCode, discount / selectedSeats.size(), total / selectedSeats.size());
                
                // Get the booking ID
                Long bookingId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
                bookingIds.add(bookingId);
            }
            
            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("ok", true);
            response.put("message", "Booking created successfully");
            response.put("bookingIds", bookingIds);
            response.put("bookingDetails", Map.of(
                "movieTitle", showtimeDetails.get("title"),
                "theaterName", showtimeDetails.get("theater_name"),
                "showTime", showtimeDetails.get("show_time"),
                "seats", selectedSeats,
                "ticketPrice", ticketPrice,
                "subtotal", subtotal,
                "discount", discount,
                "total", total,
                "promoCode", promoCode != null ? promoCode : ""
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
                SELECT b.id, b.seat_number, b.ticket_price, b.status, b.booking_time, b.total_amount,
                       m.title as movie_title, m.poster_url, s.show_time, t.name as theater_name
                FROM bookings b
                JOIN showtimes s ON b.showtime_id = s.id
                JOIN movies m ON s.movie_id = m.id
                JOIN theaters t ON s.theater_id = t.id
                WHERE b.user_id = ?
                ORDER BY b.booking_time DESC
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
                SELECT b.status, s.show_time
                FROM bookings b
                JOIN showtimes s ON b.showtime_id = s.id
                WHERE b.id = ? AND b.user_id = ?
            """;
            
            Map<String, Object> booking = jdbc.queryForMap(checkSql, bookingId, userId);
            String status = booking.get("status").toString();
            Timestamp showTime = (Timestamp) booking.get("show_time");
            
            if (!"pending".equals(status) && !"confirmed".equals(status)) {
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

    // Helper method to generate seat map
    private Map<String, Object> generateSeatMap(Integer capacity, List<String> bookedSeats) {
        Map<String, Object> seatMap = new HashMap<>();
        List<Map<String, Object>> seats = new ArrayList<>();
        
        // Calculate rows and seats per row based on capacity
        int seatsPerRow = 10;
        int numRows = (int) Math.ceil((double) capacity / seatsPerRow);
        
        for (int row = 0; row < numRows; row++) {
            char rowLetter = (char) ('A' + row);
            for (int seat = 1; seat <= seatsPerRow && (row * seatsPerRow + seat) <= capacity; seat++) {
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
        seatMap.put("capacity", capacity);
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
            // Check if showtime has bookings
            String bookingCheck = "SELECT COUNT(*) FROM bookings WHERE showtime_id = ?";
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