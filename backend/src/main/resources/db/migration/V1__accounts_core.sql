-- Roles
CREATE TABLE roles (
  id TINYINT UNSIGNED PRIMARY KEY,
  name VARCHAR(32) NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT INTO roles (id, name) VALUES (1,'ADMIN'),(2,'REGISTERED');

-- Users
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

-- Prevent email changes after creation
CREATE TRIGGER trg_users_no_email_update
BEFORE UPDATE ON users FOR EACH ROW
BEGIN
  IF NEW.email <> OLD.email THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email cannot be changed';
  END IF;
END;

-- User roles (RBAC)
CREATE TABLE user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- Promotions subscription toggle
CREATE TABLE promotion_subscriptions (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  subscribed BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Addresses (max one of each type per user)
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

-- Payment cards (tokenized only) — max 3 per user
CREATE TABLE payment_cards (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  brand VARCHAR(20),
  last4 CHAR(4),
  exp_month TINYINT UNSIGNED,
  exp_year  SMALLINT UNSIGNED,
  processor_token VARCHAR(191) NOT NULL,  -- e.g., Stripe PM id
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TRIGGER trg_cards_max3
BEFORE INSERT ON payment_cards FOR EACH ROW
BEGIN
  DECLARE cnt INT;
  SELECT COUNT(*) INTO cnt FROM payment_cards WHERE user_id = NEW.user_id;
  IF cnt >= 3 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Max 3 payment cards per user';
  END IF;
END;

-- Helpful index
CREATE INDEX idx_users_phone ON users(phone);
