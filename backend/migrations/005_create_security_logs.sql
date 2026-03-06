CREATE TABLE security_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  endpoint VARCHAR(500) NOT NULL,
  action VARCHAR(255) NOT NULL,
  status ENUM('allowed', 'denied') NOT NULL DEFAULT 'denied',
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_security_logs_user_id (user_id),
  INDEX idx_security_logs_timestamp (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
