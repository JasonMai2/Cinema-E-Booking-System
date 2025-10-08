# from repo root
cat > apply_ecinema_changes.sh <<'SCRIPT'
#!/usr/bin/env bash
set -euo pipefail

branch="feature/ecinema-db"
echo "Creating branch $branch and adding files..."

# create branch
git checkout -b "$branch"

# Make directories
mkdir -p backend/src/main/resources/db/migration
mkdir -p backend/src/main/resources
mkdir -p backend/src/main/java/com/cinemae/booking/movie
mkdir -p frontend/src/services
mkdir -p frontend/src/pages
mkdir -p docker

# ---------------------------
# V1: schema migration
# ---------------------------
cat > backend/src/main/resources/db/migration/V1__create_schema.sql <<'SQL'
-- V1__create_schema.sql
-- Core schema for eCinema (MySQL 8)
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE DATABASE IF NOT EXISTS ecinema
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE ecinema;

-- Accounts & security
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS payment_cards;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS promotion_subscriptions;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS verification_codes;
DROP TABLE IF EXISTS users;

CREATE TABLE roles (
  id TINYINT UNSIGNED PRIMARY KEY,
  name VARCHAR(32) NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT IGNORE INTO roles (id, name) VALUES (1,'ADMIN'),(2,'REGISTERED');

CREATE TABLE users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash VARBINARY(255) NOT NULL,
  first_name VARCHAR(80),
  last_name  VARCHAR(80),
  phone VARCHAR(32),
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified_at DATETIME NULL,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

CREATE TABLE promotion_subscriptions (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  subscribed BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE addresses (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type ENUM('HOME','SHIPPING') NOT NULL,
  street VARCHAR(120),
  city   VARCHAR(80),
  state  VARCHAR(40),
  postal_code VARCHAR(20),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_type (user_id, type)
) ENGINE=InnoDB;

CREATE TABLE payment_cards (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  brand VARCHAR(20),
  last4 CHAR(4),
  exp_month TINYINT UNSIGNED,
  exp_year  SMALLINT UNSIGNED,
  processor_token VARCHAR(191) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE verification_codes (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  code CHAR(6) NOT NULL,
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  UNIQUE KEY uq_user_code (user_id, code),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE password_resets (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token CHAR(64) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Movies & catalog
DROP TABLE IF EXISTS movie_categories;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS movie_people;
DROP TABLE IF EXISTS people;
DROP TABLE IF EXISTS media_assets;
DROP TABLE IF EXISTS movies;

CREATE TABLE movies (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  synopsis TEXT,
  mpaa_rating ENUM('G','PG','PG-13','R','NC-17') NULL,
  trailer_video_url VARCHAR(500),
  trailer_image_url VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE categories (
  id SMALLINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE movie_categories (
  movie_id BIGINT UNSIGNED NOT NULL,
  category_id SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (movie_id, category_id),
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE people (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE movie_people (
  movie_id BIGINT UNSIGNED NOT NULL,
  person_id BIGINT UNSIGNED NOT NULL,
  role ENUM('ACTOR','DIRECTOR','PRODUCER') NOT NULL,
  PRIMARY KEY (movie_id, person_id, role),
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE media_assets (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  movie_id BIGINT UNSIGNED NOT NULL,
  kind ENUM('POSTER','STILL','TRAILER_IMAGE','TRAILER_VIDEO') NOT NULL,
  url VARCHAR(500) NOT NULL,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE FULLTEXT INDEX ft_movies_title_synopsis ON movies (title, synopsis);

-- Auditoriums & seats
DROP TABLE IF EXISTS seats;
DROP TABLE IF EXISTS auditoriums;
DROP TABLE IF EXISTS price_rules;
DROP TABLE IF EXISTS showtimes;

CREATE TABLE auditoriums (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  seat_rows INT UNSIGNED,
  seat_cols INT UNSIGNED
) ENGINE=InnoDB;

CREATE TABLE seats (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  auditorium_id INT UNSIGNED NOT NULL,
  row_label VARCHAR(4) NOT NULL,
  seat_number INT UNSIGNED NOT NULL,
  seat_type ENUM('STANDARD','ACCESSIBLE','PREMIUM') NOT NULL DEFAULT 'STANDARD',
  UNIQUE KEY uq_aud_row_seat (auditorium_id, row_label, seat_number),
  FOREIGN KEY (auditorium_id) REFERENCES auditoriums(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE showtimes (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  movie_id BIGINT UNSIGNED NOT NULL,
  auditorium_id INT UNSIGNED NOT NULL,
  starts_at DATETIME NOT NULL,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (auditorium_id) REFERENCES auditoriums(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_auditorium_start (auditorium_id, starts_at)
) ENGINE=InnoDB;

CREATE TABLE price_rules (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  scope ENUM('GLOBAL','MOVIE','SHOWTIME') NOT NULL DEFAULT 'GLOBAL',
  movie_id BIGINT UNSIGNED NULL,
  showtime_id BIGINT UNSIGNED NULL,
  child_cents INT UNSIGNED NOT NULL,
  adult_cents INT UNSIGNED NOT NULL,
  senior_cents INT UNSIGNED NOT NULL,
  booking_fee_cents INT UNSIGNED NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  effective_from DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  effective_to DATETIME NULL,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bookings & payments
DROP TABLE IF EXISTS seat_locks;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS promotion_codes;
DROP TABLE IF EXISTS promotions;

CREATE TABLE seat_locks (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  showtime_id BIGINT UNSIGNED NOT NULL,
  seat_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  locked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  UNIQUE KEY uq_lock (showtime_id, seat_id),
  FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE,
  FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE bookings (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  booking_number CHAR(14) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('PENDING','PAID','CANCELLED','EXPIRED') NOT NULL DEFAULT 'PENDING',
  subtotal_cents INT UNSIGNED NOT NULL DEFAULT 0,
  fees_cents INT UNSIGNED NOT NULL DEFAULT 0,
  tax_cents INT UNSIGNED NOT NULL DEFAULT 0,
  total_cents INT UNSIGNED NOT NULL DEFAULT 0,
  promo_code_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tickets (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  ticket_number CHAR(16) NOT NULL UNIQUE,
  booking_id BIGINT UNSIGNED NOT NULL,
  showtime_id BIGINT UNSIGNED NOT NULL,
  seat_id BIGINT UNSIGNED NOT NULL,
  age_category ENUM('CHILD','ADULT','SENIOR') NOT NULL,
  price_cents INT UNSIGNED NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE RESTRICT,
  FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_showtime_seat (showtime_id, seat_id)
) ENGINE=InnoDB;

CREATE TABLE payments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  booking_id BIGINT UNSIGNED NOT NULL UNIQUE,
  processor VARCHAR(40) NOT NULL,
  processor_charge_id VARCHAR(191) NOT NULL,
  brand VARCHAR(20),
  last4 CHAR(4),
  amount_cents INT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  success BOOLEAN NOT NULL,
  paid_at DATETIME,
  raw_response JSON,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE promotions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  percent_off DECIMAL(5,2) NULL,
  flat_off_cents INT UNSIGNED NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE promotion_codes (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  promotion_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(40) NOT NULL UNIQUE,
  max_redemptions INT UNSIGNED NULL,
  redeemed_count INT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Indexes & views
CREATE INDEX idx_showtimes_movie_time ON showtimes (movie_id, starts_at);
CREATE INDEX idx_bookings_user_created ON bookings (user_id, created_at);
CREATE INDEX idx_tickets_showtime ON tickets (showtime_id);

CREATE OR REPLACE VIEW v_now_playing AS
SELECT m.id AS movie_id, m.title, m.mpaa_rating, MIN(s.starts_at) AS first_show, MAX(s.starts_at) AS last_show
FROM movies m
JOIN showtimes s ON s.movie_id = m.id
WHERE s.starts_at BETWEEN (NOW() - INTERVAL 1 DAY) AND (NOW() + INTERVAL 14 DAY)
GROUP BY m.id, m.title, m.mpaa_rating;
SQL

# ---------------------------
# V3: seed movies & categories
# ---------------------------
cat > backend/src/main/resources/db/migration/V3__seed_movies_and_categories.sql <<'SQL'
-- V3__seed_movies_and_categories.sql
INSERT IGNORE INTO categories (id, name) VALUES
(1,'Action'),(2,'Adventure'),(3,'Drama'),(4,'Comedy'),(5,'Sci-Fi'),
(6,'Thriller'),(7,'Romance'),(8,'Animation'),(9,'Family'),(10,'Horror'),
(11,'Fantasy'),(12,'Crime'),(13,'Biography');

INSERT INTO movies (title, synopsis, mpaa_rating, created_at) VALUES
('The Shawshank Redemption','Two imprisoned men bond over years, finding solace and eventual redemption.','R',NOW()),
('The Godfather','The aging patriarch of an organized crime dynasty transfers control to his reluctant son.','R',NOW()),
('The Dark Knight','Batman faces the Joker who thrusts Gotham into anarchy and forces moral choices.','PG-13',NOW()),
('Pulp Fiction','Intersecting stories of crime and redemption in LA with dark humor and style.','R',NOW()),
('Forrest Gump','A man with innocence influences several historical events while searching for his love.','PG-13',NOW()),
('Inception','A thief who steals corporate secrets through dream-sharing gets one last job: inception.','PG-13',NOW()),
('The Matrix','A hacker discovers reality is a simulation and joins a rebellion against machines.','R',NOW()),
('Interstellar','Explorers travel through a wormhole to secure humanity''s future among the stars.','PG-13',NOW()),
('Spirited Away','A young girl enters a mysterious spirit world and must save her parents.','PG',NOW()),
('The Lion King','A young lion prince must reclaim his kingdom after loss and exile.','G',NOW()),
('Avengers: Endgame','The Avengers assemble once more to undo Thanos'' devastating actions.','PG-13',NOW()),
('Jurassic Park','Scientists clone dinosaurs to populate a theme park with disastrous results.','PG-13',NOW()),
('Titanic','A young couple from different social classes fall in love aboard the doomed liner.','PG-13',NOW()),
('The Lord of the Rings: The Fellowship of the Ring','A hobbit begins a quest to destroy an all-powerful ring.','PG-13',NOW()),
('Gladiator','A general becomes a gladiator and seeks vengeance against an emperor.','R',NOW()),
('Back to the Future','A teen goes back in time and must ensure his parents fall in love to return.','PG',NOW()),
('Toy Story','Toys come to life and a cowboy and spaceman learn to work together.','G',NOW()),
('Saving Private Ryan','WWII soldiers risk everything to retrieve a paratrooper behind enemy lines.','R',NOW()),
('The Prestige','Two magicians become bitter rivals with tragic consequences.','PG-13',NOW()),
('Whiplash','A young drummer endures extreme teaching methods to become great.','R',NOW()),
('La La Land','An aspiring actress and a jazz musician fall in love while pursuing careers.','PG-13',NOW()),
('Parasite','A poor family ingratiates itself into a wealthy household with consequences.','R',NOW()),
('Mad Max: Fury Road','In a desert wasteland, rebels help a woman escape a tyrant''s army.','R',NOW()),
('Alien','The crew of a spaceship faces a deadly extraterrestrial organism.','R',NOW()),
('Casablanca','A nightclub owner must choose between love and helping former lovers escape.','PG',NOW()),
('The Departed','Undercover cops and moles in the mob try to identify each other in Boston.','R',NOW()),
('Eternal Sunshine of the Spotless Mind','After a painful breakup, two people erase memories of each other.','R',NOW()),
('Coco','A boy journeys to the Land of the Dead to uncover family history and music.','PG',NOW()),
('The Social Network','The story of Facebook''s founding and legal battles that followed.','PG-13',NOW());

-- Map a few categories for demo
INSERT IGNORE INTO movie_categories (movie_id, category_id)
SELECT m.id, c.id FROM movies m JOIN categories c ON
  ((m.title LIKE '%Avengers%' AND c.name='Action') OR
   (m.title LIKE '%Matrix%' AND c.name='Sci-Fi') OR
   (m.title LIKE '%Toy Story%' AND c.name='Animation') OR
   (m.title LIKE '%Coco%' AND c.name='Animation') OR
   (m.title LIKE '%Spirited Away%' AND c.name='Animation') OR
   (m.title LIKE '%Titanic%' AND c.name='Romance') OR
   (m.title LIKE '%La La Land%' AND c.name='Romance') OR
   (m.title LIKE '%The Godfather%' AND c.name='Crime') OR
   (m.title LIKE '%The Departed%' AND c.name='Crime')
  );
SQL

# ---------------------------
# application-dev.yml
# ---------------------------
cat > backend/src/main/resources/application-dev.yml <<'YML'
server:
  port: 8080

spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3307/ecinema?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=utf8
    username: cinemae
    password: devsecret
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    open-in-view: false
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQLDialect

  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
    baseline-version: 0
YML

# ---------------------------
# Movie.java (entity)
# ---------------------------
cat > backend/src/main/java/com/cinemae/booking/movie/Movie.java <<'JAVA'
package com.cinemae.booking.movie;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "movies")
public class Movie {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String synopsis;

    @Column(name = "mpaa_rating")
    private String mpaaRating;

    @Column(name="trailer_video_url")
    private String trailerVideoUrl;

    @Column(name="trailer_image_url")
    private String trailerImageUrl;

    @Column(name="created_at", insertable=false, updatable=false)
    private Instant createdAt;

    // getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSynopsis() { return synopsis; }
    public void setSynopsis(String synopsis) { this.synopsis = synopsis; }

    public String getMpaaRating() { return mpaaRating; }
    public void setMpaaRating(String mpaaRating) { this.mpaaRating = mpaaRating; }

    public String getTrailerVideoUrl() { return trailerVideoUrl; }
    public void setTrailerVideoUrl(String trailerVideoUrl) { this.trailerVideoUrl = trailerVideoUrl; }

    public String getTrailerImageUrl() { return trailerImageUrl; }
    public void setTrailerImageUrl(String trailerImageUrl) { this.trailerImageUrl = trailerImageUrl; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
JAVA

# ---------------------------
# MovieRepository.java
# ---------------------------
cat > backend/src/main/java/com/cinemae/booking/movie/MovieRepository.java <<'JAVA'
package com.cinemae.booking.movie;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface MovieRepository extends org.springframework.data.jpa.repository.JpaRepository<Movie, Long> {

    Page<Movie> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    @Query(value = "SELECT * FROM movies WHERE MATCH(title, synopsis) AGAINST (:q IN BOOLEAN MODE)",
           countQuery = "SELECT COUNT(*) FROM movies WHERE MATCH(title, synopsis) AGAINST (:q IN BOOLEAN MODE)",
           nativeQuery = true)
    Page<Movie> fullTextSearch(@Param("q") String q, Pageable pageable);
}
JAVA

# ---------------------------
# MovieService.java
# ---------------------------
cat > backend/src/main/java/com/cinemae/booking/movie/MovieService.java <<'JAVA'
package com.cinemae.booking.movie;

import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

@Service
public class MovieService {
    public final MovieRepository repo;

    public MovieService(MovieRepository repo) {
        this.repo = repo;
    }

    public Page<Movie> search(String q, int page, int size) {
        Pageable p = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (q == null || q.trim().isEmpty()) {
            return repo.findAll(p);
        }
        String booleanQuery = String.join(" ", java.util.Arrays.stream(q.split("\\s+"))
                .map(t -> "+" + t + "*")
                .toArray(String[]::new));
        try {
            return repo.fullTextSearch(booleanQuery, p);
        } catch (Exception ex) {
            return repo.findByTitleContainingIgnoreCase(q, p);
        }
    }
}
JAVA

# ---------------------------
# MovieController.java
# ---------------------------
cat > backend/src/main/java/com/cinemae/booking/movie/MovieController.java <<'JAVA'
package com.cinemae.booking.movie;

import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/movies")
@CrossOrigin(origins = "http://localhost:3000")
public class MovieController {
    private final MovieService service;

    public MovieController(MovieService service) { this.service = service; }

    @GetMapping
    public Page<Movie> list(
            @RequestParam(value="q", required=false) String q,
            @RequestParam(value="page", defaultValue="0") int page,
            @RequestParam(value="size", defaultValue="12") int size) {
        return service.search(q, page, size);
    }

    @GetMapping("/{id}")
    public Movie get(@PathVariable Long id) {
        return service.repo.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));
    }
}
JAVA

# ---------------------------
# Frontend: api helper
# ---------------------------
cat > frontend/src/services/api.js <<'JS'
const API_BASE = process.env.REACT_APP_API_BASE || '';

export async function fetchMovies({ q = '', page = 0, size = 12 } = {}) {
  const params = new URLSearchParams();
  if (q) params.append('q', q);
  params.append('page', page);
  params.append('size', size);
  const res = await fetch(`${API_BASE}/api/movies?${params.toString()}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export default { fetchMovies };
JS

# ---------------------------
# Frontend: Home.js (simple)
# ---------------------------
cat > frontend/src/pages/Home.js <<'JS'
import React, {useState, useEffect} from 'react';
import { fetchMovies } from '../services/api';

export default function Home(){
  const [q, setQ] = useState('');
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchMovies({ q, page }).then(data => {
      setMovies(data.content || []);
    }).catch(err => {
      console.error(err);
    });
  }, [q, page]);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search movies..." style={{ width: 320, padding: 8 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {movies.map(m => (
          <div key={m.id} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
            <img src={m.trailerImageUrl || '/placeholder.png'} alt={m.title} style={{ width: '100%', height: 150, objectFit: 'cover' }} />
            <h3>{m.title}</h3>
            <p style={{ fontSize: 14 }}>{m.synopsis ? m.synopsis.substring(0,160) + '...' : ''}</p>
            <a href={`/movie/${m.id}`}>Details</a>
          </div>
        ))}
      </div>
    </div>
  );
}
JS

# ---------------------------
# docker-compose.adminer.yml
# ---------------------------
cat > docker-compose.adminer.yml <<'YML'
version: "3.8"
services:
  adminer:
    image: adminer
    container_name: cinemae-adminer
    restart: unless-stopped
    ports:
      - "8083:8080"
YML

# ---------------------------
# README snippet
# ---------------------------
cat > README_DB_SETUP.md <<'MD'
# eCinema DB & local dev quickstart

1. Start DB:
   - ensure Docker Desktop is running
   - from repo root:
     docker compose -f docker-compose.yml up -d mysql

2. Create ecinema DB & app user (if needed):
   docker exec -i cinemae-mysql mysql -uroot -prootpw <<'SQL'
   CREATE DATABASE IF NOT EXISTS ecinema CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER IF NOT EXISTS 'cinemae'@'%' IDENTIFIED BY 'devsecret';
   GRANT ALL PRIVILEGES ON ecinema.* TO 'cinemae'@'%';
   FLUSH PRIVILEGES;
   SQL

3. Apply migrations (Flyway will auto-run when backend starts if enabled).
   OR run manually:
   cat backend/src/main/resources/db/migration/*.sql | docker exec -i cinemae-mysql mysql -ucinemae -pdevsecret ecinema

4. Start backend (dev profile):
   cd backend
   chmod +x ./mvnw
   ./mvnw -DskipTests spring-boot:run -Dspring-boot.run.profiles=dev

5. Start frontend:
   cd frontend
   npm install
   npm start

6. Adminer (optional GUI):
   docker compose -f docker-compose.adminer.yml up -d
   Open http://localhost:8083 and connect to 127.0.0.1:3307 user=cinemae password=devsecret database=ecinema
MD

# ---------------------------
# Git add & commit
# ---------------------------
git add -A
git commit -m "Add eCinema DB schema, seed, API endpoints, and frontend search helper (feature/ecinema-db)"
echo "Files added and committed on branch $branch"
echo "Run: git push --set-upstream origin $branch"
SCRIPT

chmod +x apply_ecinema_changes.sh
echo "Created apply_ecinema_changes.sh. Run './apply_ecinema_changes.sh' now to add files and commit."
SCRIPT
