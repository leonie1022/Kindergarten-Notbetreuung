-- MySQL schema for Notbetreurung app

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS dates (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  date_value DATE NOT NULL UNIQUE,
  label VARCHAR(64) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS offers (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  date_id INT UNSIGNED NOT NULL,
  child_name VARCHAR(128) NOT NULL,
  `group` ENUM('A','B','C','D') NOT NULL,
  taken_by_name VARCHAR(128) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  taken_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_offers_date (date_id),
  CONSTRAINT fk_offers_date FOREIGN KEY (date_id) REFERENCES dates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample seed dates (adjust as needed)
INSERT INTO dates (date_value, label) VALUES
  (DATE_ADD(CURDATE(), INTERVAL 1 DAY), NULL),
  (DATE_ADD(CURDATE(), INTERVAL 2 DAY), NULL),
  (DATE_ADD(CURDATE(), INTERVAL 3 DAY), NULL)
ON DUPLICATE KEY UPDATE label = VALUES(label);

