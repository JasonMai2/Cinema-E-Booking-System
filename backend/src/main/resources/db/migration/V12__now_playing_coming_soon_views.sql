-- V12__now_playing_coming_soon_views.sql
-- Create views for Now Playing and Coming Soon movies based on showtimes

-- Drop views if they exist (for idempotence)
DROP VIEW IF EXISTS v_now_playing;
DROP VIEW IF EXISTS v_coming_soon;

-- Now Playing: Movies with showtimes in the next 14 days
CREATE VIEW v_now_playing AS
SELECT 
    movie_id, 
    MIN(starts_at) AS first_show, 
    MAX(starts_at) AS last_show
FROM showtimes
WHERE starts_at >= NOW() 
  AND starts_at <= DATE_ADD(NOW(), INTERVAL 14 DAY)
GROUP BY movie_id;

-- Coming Soon: Movies with showtimes more than 14 days in the future
-- (but not currently showing)
CREATE VIEW v_coming_soon AS
SELECT 
    movie_id, 
    MIN(starts_at) AS first_show
FROM showtimes
WHERE starts_at > DATE_ADD(NOW(), INTERVAL 14 DAY)
  AND movie_id NOT IN (
      SELECT DISTINCT movie_id 
      FROM showtimes 
      WHERE starts_at >= NOW() 
        AND starts_at <= DATE_ADD(NOW(), INTERVAL 14 DAY)
  )
GROUP BY movie_id;
