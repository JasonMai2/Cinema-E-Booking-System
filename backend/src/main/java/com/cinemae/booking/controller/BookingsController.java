package com.cinemae.booking.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingsController {

    private final JdbcTemplate jdbc;

    @Autowired
    public BookingsController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @PostMapping
    public Map<String,Object> create(@RequestBody Map<String,Object> body) {
        // Expected body: { showId: number, seatId: number, userEmail: string }
        Long showId = ((Number)body.getOrDefault("showId", 0)).longValue();
        Long seatId = ((Number)body.getOrDefault("seatId", 0)).longValue();
        String email = (String) body.getOrDefault("userEmail", "guest@local");

        // Mark seat as BOOKED and insert booking
        jdbc.update("UPDATE seats SET status='BOOKED' WHERE id = ?", seatId);
        jdbc.update("INSERT INTO bookings (show_id, seat_id, user_email, status, created_at) VALUES (?, ?, ?, 'CONFIRMED', CURRENT_TIMESTAMP)", showId, seatId, email);

        return Map.of("ok", true, "showId", showId, "seatId", seatId);
    }

    @GetMapping("/show/{showId}")
    public List<Map<String,Object>> listForShow(@PathVariable Long showId) {
        return jdbc.queryForList("SELECT b.id, b.seat_id, b.user_email, b.status, b.created_at FROM bookings b WHERE b.show_id = ?", showId);
    }
}
