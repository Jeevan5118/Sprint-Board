CREATE TABLE IF NOT EXISTS kanban_column_limits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  column_name VARCHAR(50) NOT NULL,
  wip_limit INT NOT NULL,
  CONSTRAINT fk_kcl_project_id
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_kcl_project_column (project_id, column_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE task_status_history
  ADD INDEX idx_tsh_task_status_changed (task_id, to_status, changed_at);

ALTER TABLE tasks
  ADD INDEX idx_tasks_project_status (project_id, status);

ALTER TABLE kanban_column_limits
  ADD INDEX idx_kcl_project_column (project_id, column_name);

ALTER TABLE task_time_logs
  ADD INDEX idx_ttl_task_id (task_id);
