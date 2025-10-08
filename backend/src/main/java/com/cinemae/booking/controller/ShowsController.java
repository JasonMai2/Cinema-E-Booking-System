package com.cinemae.booking.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shows")
public class ShowsController {

    private final JdbcTemplate jdbc;

    @Autowired
    public ShowsController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public List<Map<String,Object>> list() {
        String sql = "SELECT s.id, s.movie_id, m.title, s.start_time, s.auditorium FROM shows s LEFT JOIN movies m ON m.id = s.movie_id ORDER BY s.start_time ASC";
        return jdbc.queryForList(sql);
    }
}
