package com.cinemae.booking.bootstrap;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.context.event.EventListener;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import java.util.List;

@Component
@Profile("dev")
public class DataSeeder {

    private final JdbcTemplate jdbc;

    @Autowired
    public DataSeeder(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void seed() {
        try {
            // Create minimal tables if they don't exist (compatible with H2/MySQL)
            jdbc.execute("CREATE TABLE IF NOT EXISTS categories (id INT PRIMARY KEY, name VARCHAR(255));");
            jdbc.execute("CREATE TABLE IF NOT EXISTS movies (id BIGINT PRIMARY KEY AUTO_INCREMENT, title VARCHAR(512), synopsis CLOB, mpaa_rating VARCHAR(16), trailer_video_url VARCHAR(1024), trailer_image_url VARCHAR(1024), created_at TIMESTAMP);");
            jdbc.execute("CREATE TABLE IF NOT EXISTS movie_categories (movie_id BIGINT, category_id INT);");

            // Minimal shows/screenings and seating model for dev
            jdbc.execute("CREATE TABLE IF NOT EXISTS shows (id BIGINT PRIMARY KEY AUTO_INCREMENT, movie_id BIGINT, start_time TIMESTAMP, auditorium VARCHAR(100));");
            jdbc.execute("CREATE TABLE IF NOT EXISTS seats (id BIGINT PRIMARY KEY AUTO_INCREMENT, show_id BIGINT, row_label VARCHAR(8), seat_number INT, status VARCHAR(32));");
            jdbc.execute("CREATE TABLE IF NOT EXISTS bookings (id BIGINT PRIMARY KEY AUTO_INCREMENT, show_id BIGINT, seat_id BIGINT, user_email VARCHAR(320), status VARCHAR(32), created_at TIMESTAMP);");

            // Seed categories if empty
            Integer catCount = jdbc.queryForObject("SELECT COUNT(*) FROM categories", Integer.class);
            if (catCount == null || catCount == 0) {
                jdbc.update("INSERT INTO categories (id, name) VALUES (1, 'Action'),(2,'Adventure'),(3,'Drama'),(4,'Comedy'),(5,'Sci-Fi'),(6,'Thriller'),(7,'Romance'),(8,'Animation'),(9,'Family'),(10,'Horror'),(11,'Fantasy'),(12,'Crime'),(13,'Biography');");
            }

            // Seed a few movies if empty (subset from V3)
            Integer movieCount = jdbc.queryForObject("SELECT COUNT(*) FROM movies", Integer.class);
            if (movieCount == null || movieCount == 0) {
                jdbc.update("INSERT INTO movies (title, synopsis, mpaa_rating, trailer_video_url, trailer_image_url, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                        "The Shawshank Redemption",
                        "Two imprisoned men bond over years, finding solace and eventual redemption.",
                        "R",
                        "",
                        "");

                jdbc.update("INSERT INTO movies (title, synopsis, mpaa_rating, trailer_video_url, trailer_image_url, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                        "The Godfather",
                        "The aging patriarch of an organized crime dynasty transfers control to his reluctant son.",
                        "R",
                        "",
                        "");

                jdbc.update("INSERT INTO movies (title, synopsis, mpaa_rating, trailer_video_url, trailer_image_url, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                        "The Dark Knight",
                        "Batman faces the Joker who thrusts Gotham into anarchy and forces moral choices.",
                        "PG-13",
                        "",
                        "");

                // Associate simple categories (movie id assumes auto-increment starting at 1)
                jdbc.update("INSERT INTO movie_categories (movie_id, category_id) VALUES (1,1),(2,12),(3,1);");

                // Create a sample show for movie id 1 (shawshank) and seats
                jdbc.update("INSERT INTO shows (movie_id, start_time, auditorium) VALUES (?, CURRENT_TIMESTAMP + 86400000, 'Auditorium 1')", 1);
                List<Long> showIds = jdbc.query("SELECT id FROM shows WHERE movie_id = ? ORDER BY id DESC LIMIT 1", (rs, rowNum) -> rs.getLong("id"), 1);
                Long showId = showIds.isEmpty() ? null : showIds.get(0);
                if (showId != null) {
                    // Insert a small grid of seats (rows A-C, seats 1-8)
                    for (char r = 'A'; r <= 'C'; r++) {
                        for (int s = 1; s <= 8; s++) {
                            jdbc.update("INSERT INTO seats (show_id, row_label, seat_number, status) VALUES (?, ?, ?, 'AVAILABLE')", showId, String.valueOf(r), s);
                        }
                    }

                    // Book a couple of seats to simulate taken seats
                    List<Long> seat1List = jdbc.query("SELECT id FROM seats WHERE show_id = ? AND row_label = ? AND seat_number = ?", (rs, rn) -> rs.getLong("id"), showId, "A", 1);
                    List<Long> seat2List = jdbc.query("SELECT id FROM seats WHERE show_id = ? AND row_label = ? AND seat_number = ?", (rs, rn) -> rs.getLong("id"), showId, "A", 2);
                    Long seat1 = seat1List.isEmpty() ? null : seat1List.get(0);
                    Long seat2 = seat2List.isEmpty() ? null : seat2List.get(0);
                    if (seat1 != null) jdbc.update("UPDATE seats SET status='BOOKED' WHERE id = ?", seat1);
                    if (seat2 != null) jdbc.update("UPDATE seats SET status='BOOKED' WHERE id = ?", seat2);
                    if (seat1 != null) jdbc.update("INSERT INTO bookings (show_id, seat_id, user_email, status, created_at) VALUES (?, ?, ?, 'CONFIRMED', CURRENT_TIMESTAMP)", showId, seat1, "sample@local.dev");
                }
            }

        } catch (Exception ex) {
            // Don't fail startup if seeding errors occur; just log to stdout for visibility
            System.out.println("DataSeeder: seeding failed: " + ex.getMessage());
        }
    }
}
