CREATE TABLE task_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  from_status VARCHAR(50),
  to_status VARCHAR(50),
  changed_by INT,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  INDEX idx_task_status_history_task_id (task_id),
  INDEX idx_task_status_history_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
