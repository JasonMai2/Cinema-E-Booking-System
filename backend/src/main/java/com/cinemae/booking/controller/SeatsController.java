package com.cinemae.booking.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shows/{showId}/seats")
public class SeatsController {

    private final JdbcTemplate jdbc;

    @Autowired
    public SeatsController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public List<Map<String,Object>> list(@PathVariable("showId") Long showId) {
        String sql = "SELECT id, row_label, seat_number, status FROM seats WHERE show_id = ? ORDER BY row_label, seat_number";
        return jdbc.queryForList(sql, showId);
    }
}
