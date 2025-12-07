-- Safety migration: ensure payment_methods table exists (older environments may have missed V4)
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
  CONSTRAINT fk_pm_user_compat FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Backfill from legacy payment_cards table when available
SET @has_cards :=
  (SELECT COUNT(*)
   FROM information_schema.tables
   WHERE table_schema = DATABASE()
     AND table_name = 'payment_cards');

SET @sql := IF(
  @has_cards > 0,
  'INSERT INTO payment_methods (user_id, provider, provider_token, brand, last4, exp_month, exp_year, is_default, billing_address, created_at, updated_at)
   SELECT pc.user_id,
          ''legacy-card'',
          pc.processor_token,
          pc.brand,
          pc.last4,
          pc.exp_month,
          pc.exp_year,
          pc.is_default,
          NULL,
          pc.created_at,
          pc.created_at
   FROM payment_cards pc
   WHERE NOT EXISTS (
     SELECT 1
     FROM payment_methods pm
     WHERE pm.provider_token = pc.processor_token
       AND pm.user_id = pc.user_id
   )',
  'DO 0'
);

PREPARE ensure_pm_stmt FROM @sql;
EXECUTE ensure_pm_stmt;
DEALLOCATE PREPARE ensure_pm_stmt;
