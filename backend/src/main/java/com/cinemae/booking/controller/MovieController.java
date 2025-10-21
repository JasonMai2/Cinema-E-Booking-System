package com.cinemae.booking.controller;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private final JdbcTemplate jdbc;

    @Autowired
    public MovieController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public Map<String, Object> list(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "12") int size
    ) {
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

        // total count
        String countSql = "SELECT COUNT(*) FROM movies" + where;
        Integer total = jdbc.queryForObject(countSql, params.toArray(), Integer.class);
        if (total == null) total = 0;

        // fetch page
        int offset = page * size;
        String sql = "SELECT id, title, mpaa_rating, synopsis, trailer_video_url, trailer_image_url FROM movies"
                + where + " ORDER BY id ASC LIMIT ? OFFSET ?";

        // add pagination params
        params.add(size);
        params.add(offset);

        List<Map<String, Object>> rows = jdbc.queryForList(sql, params.toArray());

        // build response
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("page", page);
        resp.put("size", size);
        resp.put("totalElements", total);
        resp.put("totalPages", (int) Math.ceil(total / (double) size));
        resp.put("content", rows);

        return resp;
    }

    @GetMapping("/{id}")
    public Map<String, Object> getById(@PathVariable("id") Integer id) {
        Map<String, Object> resp = new HashMap<>();
        if (id == null) {
            resp.put("ok", false);
            resp.put("message", "id required");
            return resp;
        }

        List<Map<String, Object>> rows = jdbc.queryForList("SELECT id, title, mpaa_rating, synopsis, trailer_video_url, trailer_image_url FROM movies WHERE id = ?", id);
        if (rows.isEmpty()) {
            resp.put("ok", false);
            resp.put("message", "movie not found");
            return resp;
        }

        Map<String, Object> movie = rows.get(0);
        resp.put("ok", true);
        resp.put("movie", movie);
        return resp;
    }

    // quick ping for health of movie endpoint
    @GetMapping("/ping")
    public Map<String, Object> ping() {
        Map<String, Object> p = new HashMap<>();
        p.put("ok", true);
        p.put("time", new Date());
        return p;
    }
}
