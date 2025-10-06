package com.cinemae.booking.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import java.util.*;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private final JdbcTemplate jdbc;

    @Autowired
    public MovieController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "12") int size
    ) {
        try {
            if (page < 0) page = 0;
            if (size <= 0) size = 12;

            String where = "";
            List<Object> params = new ArrayList<>();

            if (q != null && !q.trim().isEmpty()) {
                where = " WHERE title LIKE ? OR synopsis LIKE ?";
                String like = "%" + q.trim() + "%";
                params.add(like);
                params.add(like);
            }

            String countSql = "SELECT COUNT(*) FROM movies" + where;
            Integer total = jdbc.queryForObject(countSql, params.toArray(), Integer.class);
            if (total == null) total = 0;

            int offset = page * size;
            // defensive SELECT * so missing/renamed columns don't crash the query
            String sql = "SELECT * FROM movies" + where + " ORDER BY id ASC LIMIT ? OFFSET ?";
            params.add(size);
            params.add(offset);

            List<Map<String, Object>> rows = jdbc.queryForList(sql, params.toArray());

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("page", page);
            resp.put("size", size);
            resp.put("totalElements", total);
            resp.put("totalPages", (int) Math.ceil(total / (double) size));
            resp.put("content", rows);

            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            // print full stacktrace to server console (visible in mvnw output)
            e.printStackTrace();

            // also return the exception message in the HTTP response for local debugging
            Map<String,Object> err = new LinkedHashMap<>();
            err.put("error", "internal_error");
            err.put("message", e.getMessage());
            err.put("exception", e.getClass().getName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    @GetMapping("/ping")
    public Map<String, Object> ping() {
        Map<String,Object> p = new HashMap<>();
        p.put("ok", true);
        p.put("time", new Date());
        return p;
    }
}
