-- V7__ticket_prices.sql
CREATE TABLE show_ticket_prices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    show_id BIGINT NOT NULL,
    seat_category VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (show_id) REFERENCES showtimes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_show_category (show_id, seat_category)
);

-- Insert default prices for demo shows
INSERT INTO show_ticket_prices (show_id, seat_category, price) VALUES
(1, 'standard', 12.99),
(1, 'premium', 15.99),
(2, 'standard', 12.99),
(2, 'premium', 15.99);