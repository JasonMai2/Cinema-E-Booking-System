package com.cinemae.booking.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.*;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private final JdbcTemplate jdbc;

    @Autowired
    public MovieController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // List movies
    @GetMapping
    public Map<String, Object> list(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "100") int size
    ) {
        if (page < 0) page = 0;
        if (size <= 0) size = 100;

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
        String sql = """
                SELECT id, title, mpaa_rating, synopsis, trailer_video_url,
                       trailer_image_url, is_now_playing, is_coming_soon, created_at
                FROM movies
                """ + where + " ORDER BY id ASC LIMIT ? OFFSET ?";

        params.add(size);
        params.add(offset);

        List<Map<String, Object>> rows = jdbc.queryForList(sql, params.toArray());

        // attach categories to each movie
        for (Map<String, Object> movie : rows) {
            Long movieId = ((Number) movie.get("id")).longValue();
            List<Map<String, Object>> categories = jdbc.queryForList("""
                    SELECT c.id, c.name
                    FROM categories c
                    JOIN movie_categories mc ON mc.category_id = c.id
                    WHERE mc.movie_id = ?
            """, movieId);
            movie.put("categories", categories);
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("page", page);
        resp.put("size", size);
        resp.put("totalElements", total);
        resp.put("totalPages", (int) Math.ceil(total / (double) size));
        resp.put("content", rows);

        return resp;
    }

    // Get movie by ID
    @GetMapping("/{id}")
    public Map<String, Object> getById(@PathVariable("id") Integer id) {
        Map<String, Object> resp = new HashMap<>();
        if (id == null) {
            resp.put("ok", false);
            resp.put("message", "id required");
            return resp;
        }

        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT id, title, mpaa_rating, synopsis, trailer_video_url,
                       trailer_image_url, is_now_playing, is_coming_soon, created_at
                FROM movies WHERE id = ?
                """, id);

        if (rows.isEmpty()) {
            resp.put("ok", false);
            resp.put("message", "movie not found");
            return resp;
        }

        Map<String, Object> movie = rows.get(0);

        // categories
        List<Map<String, Object>> categories = jdbc.queryForList("""
                SELECT c.id, c.name
                FROM categories c
                JOIN movie_categories mc ON mc.category_id = c.id
                WHERE mc.movie_id = ?
        """, id);
        movie.put("categories", categories);

        resp.put("ok", true);
        resp.put("movie", movie);
        return resp;
    }

    // Create Movie
    @PostMapping
    public Map<String, Object> create(@RequestBody Map<String, Object> body) {
        String sql = """
                INSERT INTO movies (title, synopsis, mpaa_rating, trailer_video_url,
                                    trailer_image_url, is_now_playing, is_coming_soon)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """;

        jdbc.update(sql,
                body.get("title"),
                body.get("synopsis"),
                body.get("mpaa_rating"),
                body.get("trailer_video_url"),
                body.get("trailer_image_url"),
                body.get("is_now_playing"),
                body.get("is_coming_soon")
        );

        // get new movie ID
        Long movieId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

        // handle categories
        List<Integer> categoryIds = (List<Integer>) body.get("category_ids");
        if (categoryIds != null) {
            for (Integer catId : categoryIds) {
                jdbc.update("INSERT INTO movie_categories (movie_id, category_id) VALUES (?, ?)", movieId, catId);
            }
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("ok", true);
        resp.put("message", "movie created successfully");
        resp.put("movie_id", movieId);
        return resp;
    }

    // Update Movie
    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable("id") Long id, @RequestBody Map<String, Object> body) {
        String sql = """
                UPDATE movies SET title=?, synopsis=?, mpaa_rating=?, trailer_video_url=?,
                                  trailer_image_url=?, is_now_playing=?, is_coming_soon=?
                WHERE id=?
                """;

        jdbc.update(sql,
                body.get("title"),
                body.get("synopsis"),
                body.get("mpaa_rating"),
                body.get("trailer_video_url"),
                body.get("trailer_image_url"),
                body.get("is_now_playing"),
                body.get("is_coming_soon"),
                id
        );

        // clear entries
        jdbc.update("DELETE FROM movie_categories WHERE movie_id = ?", id);

        // reinsert categories
        List<Integer> categoryIds = (List<Integer>) body.get("category_ids");
        if (categoryIds != null) {
            for (Integer catId : categoryIds) {
                jdbc.update("INSERT INTO movie_categories (movie_id, category_id) VALUES (?, ?)", id, catId);
            }
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("ok", true);
        resp.put("message", "movie updated successfully");
        return resp;
    }

    // Delete Movie
    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable("id") Long id) {
        jdbc.update("DELETE FROM movies WHERE id = ?", id);

        Map<String, Object> resp = new HashMap<>();
        resp.put("ok", true);
        resp.put("message", "movie deleted");
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

    // Fetch all categories for dropdowns
    @GetMapping("/categories")
    public Map<String, Object> getCategories() {
        List<Map<String, Object>> list = jdbc.queryForList("SELECT id, name FROM categories ORDER BY name ASC");

        Map<String, Object> resp = new HashMap<>();
        resp.put("ok", true);
        resp.put("categories", list);
        return resp;
    }
}
