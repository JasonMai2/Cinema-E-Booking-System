CREATE DATABASE IF NOT EXISTS ecinema CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecinema;
CREATE TABLE IF NOT EXISTS movies (
  id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  synopsis TEXT NULL,
  mpaa_rating ENUM('G','PG','PG-13','R','NC-17') NULL,
  trailer_video_url VARCHAR(500) NULL,
  traile  traile  traile  traile  trail  c  traile  traES  traile N  trDE  traile  traile  tTA  traile  traile  traile  traileET  traile  traile  traile   w  traile  trails   traile  traile  traile  traile  traiemo.sql <<'SQL'
USE ecinema;
INSERT INTO movies (title,synopsis,mpaa_rating,trailer_video_url,trailer_image_url)
VALUES
  ('The Green Hour','A thrilling sci-fi about time-bending heroes.','PG-13','https://example.com/trailer1.mp4','https://image.tmdb.org/t/p/w500/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg'),
  ('Ocean of Stars','A sweeping space opera with beautiful visuals.','PG-13','https:  ('Ocean of Stars','A sweeping ps://image.t  ('Ocean of Stars','A sweeping space opNONX.jpg'),
  ('Quiet Nights','A touching drama about family and second chances.','R','https://example.com/trailer3.mp4','https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg');
