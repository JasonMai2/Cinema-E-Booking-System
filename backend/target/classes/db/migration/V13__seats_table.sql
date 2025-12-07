-- V13__seats_table.sql
-- Create seats table for auditoriums

-- Create seats table if not exists
CREATE TABLE IF NOT EXISTS seats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    auditorium_id BIGINT NOT NULL,
    row_label VARCHAR(5) NOT NULL,
    seat_number INT NOT NULL,
    seat_type VARCHAR(20) DEFAULT 'standard',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_auditorium_row_seat (auditorium_id, row_label, seat_number),
    FOREIGN KEY (auditorium_id) REFERENCES auditoriums(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Populate seats for each auditorium (10 rows x 12 seats = 120 seats per auditorium)
-- Only insert if seats table is empty
INSERT INTO seats (auditorium_id, row_label, seat_number, seat_type)
SELECT a.id, r.row_label, s.seat_number, 
       CASE 
           WHEN r.row_label IN ('A', 'B') THEN 'front'
           WHEN r.row_label IN ('I', 'J') THEN 'back'
           ELSE 'standard'
       END as seat_type
FROM auditoriums a
CROSS JOIN (
    SELECT 'A' as row_label UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D' UNION SELECT 'E'
    UNION SELECT 'F' UNION SELECT 'G' UNION SELECT 'H' UNION SELECT 'I' UNION SELECT 'J'
) r
CROSS JOIN (
    SELECT 1 as seat_number UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
    UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
) s
WHERE NOT EXISTS (SELECT 1 FROM seats LIMIT 1);
