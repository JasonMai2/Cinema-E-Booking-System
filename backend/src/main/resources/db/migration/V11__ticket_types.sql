-- V11__ticket_types.sql
-- Create ticket_types table for managing ticket pricing by age category

CREATE TABLE IF NOT EXISTS ticket_types (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    age_category VARCHAR(20) NOT NULL UNIQUE,
    price_cents INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Insert default ticket types: Child, Adult, Senior (as per requirements)
INSERT INTO ticket_types (name, age_category, price_cents, is_active) VALUES
('Child Ticket', 'child', 900, TRUE),
('Adult Ticket', 'adult', 1500, TRUE),
('Senior Ticket', 'senior', 1100, TRUE)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    price_cents = VALUES(price_cents),
    is_active = VALUES(is_active);
