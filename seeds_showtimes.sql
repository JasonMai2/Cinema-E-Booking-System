-- Seeds for auditoriums, seats, showtimes, and price rules
-- This will create a functional cinema with 3 auditoriums and showtimes for all movies

-- Insert auditoriums
INSERT INTO auditoriums (name, capacity) VALUES
('Theater 1', 120),
('Theater 2', 100),
('Theater 3', 80);

-- Get auditorium IDs (assuming they start from 1)
SET @aud1 = 1;
SET @aud2 = 2;
SET @aud3 = 3;

-- Create seats for Theater 1 (10 rows, 12 seats per row = 120 seats)
INSERT INTO seats (auditorium_id, seat_row, seat_number, seat_type)
SELECT @aud1, row_letter, seat_num, 'STANDARD'
FROM (
    SELECT 'A' as row_letter UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D' UNION SELECT 'E' 
    UNION SELECT 'F' UNION SELECT 'G' UNION SELECT 'H' UNION SELECT 'I' UNION SELECT 'J'
) rows
CROSS JOIN (
    SELECT 1 as seat_num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
    UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
) seats;

-- Create seats for Theater 2 (10 rows, 10 seats per row = 100 seats)
INSERT INTO seats (auditorium_id, seat_row, seat_number, seat_type)
SELECT @aud2, row_letter, seat_num, 'STANDARD'
FROM (
    SELECT 'A' as row_letter UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D' UNION SELECT 'E' 
    UNION SELECT 'F' UNION SELECT 'G' UNION SELECT 'H' UNION SELECT 'I' UNION SELECT 'J'
) rows
CROSS JOIN (
    SELECT 1 as seat_num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 
    UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
) seats;

-- Create seats for Theater 3 (8 rows, 10 seats per row = 80 seats)
INSERT INTO seats (auditorium_id, seat_row, seat_number, seat_type)
SELECT @aud3, row_letter, seat_num, 'STANDARD'
FROM (
    SELECT 'A' as row_letter UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D' 
    UNION SELECT 'E' UNION SELECT 'F' UNION SELECT 'G' UNION SELECT 'H'
) rows
CROSS JOIN (
    SELECT 1 as seat_num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 
    UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
) seats;

-- Create showtimes for each movie (multiple showtimes per day for the next 7 days)
-- Movies 1-10 (Inception, Matrix, Shawshank, Interstellar, Avengers, Titanic, Jurassic Park, Dark Knight, Pulp Fiction, Social Network)

-- Day 1 (Today)
INSERT INTO showtimes (movie_id, auditorium_id, starts_at) VALUES
-- Morning shows
(1, 1, DATE_ADD(CURDATE(), INTERVAL 10 HOUR)),
(2, 2, DATE_ADD(CURDATE(), INTERVAL 10 HOUR)),
(3, 3, DATE_ADD(CURDATE(), INTERVAL 10 HOUR)),
-- Afternoon shows
(4, 1, DATE_ADD(CURDATE(), INTERVAL 14 HOUR)),
(5, 2, DATE_ADD(CURDATE(), INTERVAL 14 HOUR)),
(6, 3, DATE_ADD(CURDATE(), INTERVAL 14 HOUR)),
-- Evening shows
(7, 1, DATE_ADD(CURDATE(), INTERVAL 18 HOUR)),
(8, 2, DATE_ADD(CURDATE(), INTERVAL 18 HOUR)),
(9, 3, DATE_ADD(CURDATE(), INTERVAL 18 HOUR)),
-- Late night shows
(10, 1, DATE_ADD(CURDATE(), INTERVAL 21 HOUR)),
(1, 2, DATE_ADD(CURDATE(), INTERVAL 21 HOUR)),
(2, 3, DATE_ADD(CURDATE(), INTERVAL 21 HOUR));

-- Day 2 (Tomorrow)
INSERT INTO showtimes (movie_id, auditorium_id, starts_at) VALUES
(3, 1, DATE_ADD(CURDATE(), INTERVAL 34 HOUR)),
(4, 2, DATE_ADD(CURDATE(), INTERVAL 34 HOUR)),
(5, 3, DATE_ADD(CURDATE(), INTERVAL 34 HOUR)),
(6, 1, DATE_ADD(CURDATE(), INTERVAL 38 HOUR)),
(7, 2, DATE_ADD(CURDATE(), INTERVAL 38 HOUR)),
(8, 3, DATE_ADD(CURDATE(), INTERVAL 38 HOUR)),
(9, 1, DATE_ADD(CURDATE(), INTERVAL 42 HOUR)),
(10, 2, DATE_ADD(CURDATE(), INTERVAL 42 HOUR)),
(1, 3, DATE_ADD(CURDATE(), INTERVAL 42 HOUR)),
(2, 1, DATE_ADD(CURDATE(), INTERVAL 45 HOUR)),
(3, 2, DATE_ADD(CURDATE(), INTERVAL 45 HOUR)),
(4, 3, DATE_ADD(CURDATE(), INTERVAL 45 HOUR));

-- Day 3
INSERT INTO showtimes (movie_id, auditorium_id, starts_at) VALUES
(5, 1, DATE_ADD(CURDATE(), INTERVAL 58 HOUR)),
(6, 2, DATE_ADD(CURDATE(), INTERVAL 58 HOUR)),
(7, 3, DATE_ADD(CURDATE(), INTERVAL 58 HOUR)),
(8, 1, DATE_ADD(CURDATE(), INTERVAL 62 HOUR)),
(9, 2, DATE_ADD(CURDATE(), INTERVAL 62 HOUR)),
(10, 3, DATE_ADD(CURDATE(), INTERVAL 62 HOUR)),
(1, 1, DATE_ADD(CURDATE(), INTERVAL 66 HOUR)),
(2, 2, DATE_ADD(CURDATE(), INTERVAL 66 HOUR)),
(3, 3, DATE_ADD(CURDATE(), INTERVAL 66 HOUR));

-- Day 4
INSERT INTO showtimes (movie_id, auditorium_id, starts_at) VALUES
(4, 1, DATE_ADD(CURDATE(), INTERVAL 82 HOUR)),
(5, 2, DATE_ADD(CURDATE(), INTERVAL 82 HOUR)),
(6, 3, DATE_ADD(CURDATE(), INTERVAL 82 HOUR)),
(7, 1, DATE_ADD(CURDATE(), INTERVAL 86 HOUR)),
(8, 2, DATE_ADD(CURDATE(), INTERVAL 86 HOUR)),
(9, 3, DATE_ADD(CURDATE(), INTERVAL 86 HOUR)),
(10, 1, DATE_ADD(CURDATE(), INTERVAL 90 HOUR)),
(1, 2, DATE_ADD(CURDATE(), INTERVAL 90 HOUR)),
(2, 3, DATE_ADD(CURDATE(), INTERVAL 90 HOUR));

-- Day 5
INSERT INTO showtimes (movie_id, auditorium_id, starts_at) VALUES
(3, 1, DATE_ADD(CURDATE(), INTERVAL 106 HOUR)),
(4, 2, DATE_ADD(CURDATE(), INTERVAL 106 HOUR)),
(5, 3, DATE_ADD(CURDATE(), INTERVAL 106 HOUR)),
(6, 1, DATE_ADD(CURDATE(), INTERVAL 110 HOUR)),
(7, 2, DATE_ADD(CURDATE(), INTERVAL 110 HOUR)),
(8, 3, DATE_ADD(CURDATE(), INTERVAL 110 HOUR)),
(9, 1, DATE_ADD(CURDATE(), INTERVAL 114 HOUR)),
(10, 2, DATE_ADD(CURDATE(), INTERVAL 114 HOUR)),
(1, 3, DATE_ADD(CURDATE(), INTERVAL 114 HOUR));

-- Day 6 (Weekend - more shows)
INSERT INTO showtimes (movie_id, auditorium_id, starts_at) VALUES
(2, 1, DATE_ADD(CURDATE(), INTERVAL 130 HOUR)),
(3, 2, DATE_ADD(CURDATE(), INTERVAL 130 HOUR)),
(4, 3, DATE_ADD(CURDATE(), INTERVAL 130 HOUR)),
(5, 1, DATE_ADD(CURDATE(), INTERVAL 134 HOUR)),
(6, 2, DATE_ADD(CURDATE(), INTERVAL 134 HOUR)),
(7, 3, DATE_ADD(CURDATE(), INTERVAL 134 HOUR)),
(8, 1, DATE_ADD(CURDATE(), INTERVAL 138 HOUR)),
(9, 2, DATE_ADD(CURDATE(), INTERVAL 138 HOUR)),
(10, 3, DATE_ADD(CURDATE(), INTERVAL 138 HOUR)),
(1, 1, DATE_ADD(CURDATE(), INTERVAL 141 HOUR)),
(2, 2, DATE_ADD(CURDATE(), INTERVAL 141 HOUR)),
(3, 3, DATE_ADD(CURDATE(), INTERVAL 141 HOUR));

-- Day 7 (Weekend)
INSERT INTO showtimes (movie_id, auditorium_id, starts_at) VALUES
(4, 1, DATE_ADD(CURDATE(), INTERVAL 154 HOUR)),
(5, 2, DATE_ADD(CURDATE(), INTERVAL 154 HOUR)),
(6, 3, DATE_ADD(CURDATE(), INTERVAL 154 HOUR)),
(7, 1, DATE_ADD(CURDATE(), INTERVAL 158 HOUR)),
(8, 2, DATE_ADD(CURDATE(), INTERVAL 158 HOUR)),
(9, 3, DATE_ADD(CURDATE(), INTERVAL 158 HOUR)),
(10, 1, DATE_ADD(CURDATE(), INTERVAL 162 HOUR)),
(1, 2, DATE_ADD(CURDATE(), INTERVAL 162 HOUR)),
(2, 3, DATE_ADD(CURDATE(), INTERVAL 162 HOUR)),
(3, 1, DATE_ADD(CURDATE(), INTERVAL 165 HOUR)),
(4, 2, DATE_ADD(CURDATE(), INTERVAL 165 HOUR)),
(5, 3, DATE_ADD(CURDATE(), INTERVAL 165 HOUR));

-- Create global price rule
INSERT INTO price_rules (scope, child_cents, adult_cents, senior_cents, booking_fee_cents, active, effective_from)
VALUES ('GLOBAL', 500, 1000, 800, 150, TRUE, NOW());

-- Create a special weekend pricing
INSERT INTO price_rules (scope, child_cents, adult_cents, senior_cents, booking_fee_cents, active, effective_from)
VALUES ('GLOBAL', 600, 1200, 900, 150, TRUE, DATE_ADD(CURDATE(), INTERVAL 5 DAY));
