package com.cinemae.booking.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private static final Logger log = LoggerFactory.getLogger(MovieController.class);
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

    /**
     * Get "Now Playing" movies - movies with showtimes starting from today.
     */
    @GetMapping("/now-playing")
    public ResponseEntity<?> getNowPlaying() {
        try {
            String sql = """
                SELECT DISTINCT m.id, m.title, m.mpaa_rating, m.synopsis, 
                       m.trailer_video_url, m.trailer_image_url
                FROM movies m
                JOIN showtimes s ON m.id = s.movie_id
                WHERE s.starts_at >= CURDATE()
                ORDER BY m.title ASC
                """;
            List<Map<String, Object>> movies = jdbc.queryForList(sql);
            return ResponseEntity.ok(movies);
        } catch (Exception e) {
            log.error("Error fetching now-playing movies", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch now-playing movies: " + e.getMessage()));
        }
    }

    /**
     * Get "Coming Soon" movies - movies with showtimes in the future, not in now-playing.
     */
    @GetMapping("/coming-soon")
    public ResponseEntity<?> getComingSoon() {
        try {
            String sql = """
                SELECT m.id, m.title, m.mpaa_rating, m.synopsis, 
                       m.trailer_video_url, m.trailer_image_url, MIN(s.starts_at) as first_show
                FROM movies m
                JOIN showtimes s ON m.id = s.movie_id
                WHERE s.starts_at > DATE_ADD(NOW(), INTERVAL 1 DAY)
                  AND m.id NOT IN (
                    SELECT DISTINCT m2.id
                    FROM movies m2
                    JOIN showtimes s2 ON m2.id = s2.movie_id
                    WHERE s2.starts_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                      AND s2.starts_at <= DATE_ADD(NOW(), INTERVAL 1 DAY)
                  )
                GROUP BY m.id, m.title, m.mpaa_rating, m.synopsis, m.trailer_video_url, m.trailer_image_url
                ORDER BY first_show ASC
                """;
            List<Map<String, Object>> movies = jdbc.queryForList(sql);
            return ResponseEntity.ok(movies);
        } catch (Exception e) {
            log.error("Error fetching coming-soon movies", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch coming-soon movies: " + e.getMessage()));
        }
    }
}
