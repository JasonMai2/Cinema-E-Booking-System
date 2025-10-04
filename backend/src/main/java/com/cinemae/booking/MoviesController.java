package com.cinemae.booking.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class MoviesController {

    @Autowired
    private JdbcTemplate jdbc;

    @GetMapping("/movies")
    public List<MovieDto> listMovies() {
        String sql = "SELECT id, title, synopsis, mpaa_rating FROM movies ORDER BY created_at DESC LIMIT 100";
        return jdbc.query(sql, (rs, rowNum) -> {
            MovieDto m = new MovieDto();
            m.id = rs.getLong("id");
            m.title = rs.getString("title");
            m.synopsis = rs.getString("synopsis");
            m.mpaa_rating = rs.getString("mpaa_rating");
            return m;
        });
    }
}
