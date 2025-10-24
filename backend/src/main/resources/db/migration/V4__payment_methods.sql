-- Flyway migration: create payment_methods table (token-only storage)
CREATE TABLE IF NOT EXISTS payment_methods (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  provider VARCHAR(100) NOT NULL,
  provider_token VARCHAR(255) NOT NULL,
  brand VARCHAR(50),
  last4 CHAR(4),
  exp_month TINYINT,
  exp_year SMALLINT,
  is_default BOOLEAN DEFAULT FALSE,
  billing_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pm_user FOREIGN KEY (user_id) REFERENCES users(id)
);
