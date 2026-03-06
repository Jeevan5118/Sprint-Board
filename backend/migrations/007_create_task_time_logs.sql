CREATE TABLE IF NOT EXISTS task_time_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  hours DECIMAL(5,2) NOT NULL,
  description TEXT,
  logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_task_time_logs_task
    FOREIGN KEY (task_id) REFERENCES tasks(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_task_time_logs_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  INDEX idx_task_time_logs_task_id (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
