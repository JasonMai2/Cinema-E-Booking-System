package com.cinemae.booking.controller;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private static final Logger log = LoggerFactory.getLogger(MovieController.class);
    private final JdbcTemplate jdbc;

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

    /**
     * Get "Now Playing" movies - movies with showtimes in the near future.
     * Uses the v_now_playing database view.
     */
    @GetMapping("/now-playing")
    public List<Map<String, Object>> getNowPlaying() {
        String sql = """
            SELECT m.id, m.title, m.mpaa_rating, m.synopsis, 
                   m.trailer_video_url, m.trailer_image_url,
                   np.first_show, np.last_show
            FROM v_now_playing np
            JOIN movies m ON np.movie_id = m.id
            ORDER BY np.first_show ASC
            """;
        return jdbc.queryForList(sql);
    }

    /**
     * Get "Coming Soon" movies - movies with showtimes in the future.
     * Uses the v_coming_soon database view.
     */
    @GetMapping("/coming-soon")
    public List<Map<String, Object>> getComingSoon() {
        String sql = """
            SELECT m.id, m.title, m.mpaa_rating, m.synopsis, 
                   m.trailer_video_url, m.trailer_image_url,
                   cs.first_show
            FROM v_coming_soon cs
            JOIN movies m ON cs.movie_id = m.id
            ORDER BY cs.first_show ASC
            """;
        return jdbc.queryForList(sql);
    }

    /**
     * Get movies with showtimes in a specific date range
     */
    @GetMapping("/with-showtimes")
    public Map<String, Object> getMoviesWithShowtimes(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        Map<String, Object> resp = new HashMap<>();
        
        String sql = """
            SELECT DISTINCT m.id, m.title, m.mpaa_rating, m.synopsis, 
                m.trailer_video_url, m.trailer_image_url,
                m.is_now_playing, m.is_coming_soon, m.created_at
            FROM movies m
            JOIN showtimes s ON s.movie_id = m.id
            WHERE 1=1
            """;
        
        List<Object> params = new ArrayList<>();
        
        if (startDate != null && !startDate.trim().isEmpty()) {
            sql += " AND s.starts_at >= ?";
            params.add(startDate);
        }
        
        if (endDate != null && !endDate.trim().isEmpty()) {
            sql += " AND s.starts_at <= DATE_ADD(?, INTERVAL 1 DAY)";
            params.add(endDate);
        }
        
        sql += " ORDER BY m.id ASC";
        
        List<Map<String, Object>> movies = jdbc.queryForList(sql, params.toArray());
        
        // Attach categories to each movie
        for (Map<String, Object> movie : movies) {
            Long movieId = ((Number) movie.get("id")).longValue();
            List<Map<String, Object>> categories = jdbc.queryForList("""
                SELECT c.id, c.name
                FROM categories c
                JOIN movie_categories mc ON mc.category_id = c.id
                WHERE mc.movie_id = ?
            """, movieId);
            movie.put("categories", categories);
        }
        
        resp.put("ok", true);
        resp.put("content", movies);
        return resp;
    }
}
