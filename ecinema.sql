
-- ============================================================
-- eCinema Relational Schema (MySQL 8)
-- File: ecinema.sql
-- ============================================================
-- Usage:
--   mysql -u <user> -p < /path/to/ecinema.sql
-- (Adjust user/host/port as needed.)
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET sql_notes = 0;

CREATE DATABASE IF NOT EXISTS ecinema
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE ecinema;

-- ------------------------------------------------------------
-- Accounts, Roles, Security
-- ------------------------------------------------------------
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
INSERT INTO roles (id, name) VALUES (1,'ADMIN'),(2,'REGISTERED');

CREATE TABLE users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash VARBINARY(72) NOT NULL,
  first_name VARCHAR(80),
  last_name  VARCHAR(80),
  phone VARCHAR(32),
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified_at DATETIME NULL,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

DELIMITER $$
CREATE TRIGGER trg_users_no_email_update
BEFORE UPDATE ON users FOR EACH ROW
BEGIN
  IF NEW.email <> OLD.email THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email cannot be changed';
  END IF;
END$$
DELIMITER ;

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

DELIMITER $$
CREATE TRIGGER trg_cards_max3
BEFORE INSERT ON payment_cards FOR EACH ROW
BEGIN
  DECLARE cnt INT;
  SELECT COUNT(*) INTO cnt FROM payment_cards WHERE user_id = NEW.user_id;
  IF cnt >= 3 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Max 3 payment cards per user';
  END IF;
END$$
DELIMITER ;

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

-- Helpful index
CREATE INDEX idx_users_phone ON users(phone);

-- ------------------------------------------------------------
-- Movies, People, Categories, Media
-- ------------------------------------------------------------
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

-- Fulltext for search
CREATE FULLTEXT INDEX ft_movies_title_synopsis ON movies (title, synopsis);

-- ------------------------------------------------------------
-- Auditoriums, Seats, Showtimes, Pricing
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Locks, Bookings, Tickets, Payments, Promotions
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Views & Indexes for UX
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_now_playing AS
SELECT m.id AS movie_id, m.title, m.mpaa_rating, MIN(s.starts_at) AS first_show, MAX(s.starts_at) AS last_show
FROM movies m
JOIN showtimes s ON s.movie_id = m.id
WHERE s.starts_at BETWEEN (NOW() - INTERVAL 1 DAY) AND (NOW() + INTERVAL 14 DAY)
GROUP BY m.id, m.title, m.mpaa_rating;

CREATE OR REPLACE VIEW v_coming_soon AS
SELECT m.id AS movie_id, m.title, m.mpaa_rating, MIN(s.starts_at) AS first_show
FROM movies m
JOIN showtimes s ON s.movie_id = m.id
WHERE s.starts_at > NOW()
GROUP BY m.id, m.title, m.mpaa_rating;

-- Helpful composite indexes
CREATE INDEX idx_showtimes_movie_time ON showtimes (movie_id, starts_at);
CREATE INDEX idx_bookings_user_created ON bookings (user_id, created_at);
CREATE INDEX idx_tickets_showtime ON tickets (showtime_id);

SET sql_notes = 1;
-- ============================  END  ============================
