-- Team-scoped boards migration
-- 1) Make sprints team-owned
ALTER TABLE sprints
  ADD COLUMN team_id INT NULL AFTER project_id;

UPDATE sprints s
INNER JOIN projects p ON p.id = s.project_id
SET s.team_id = p.team_id
WHERE s.team_id IS NULL;

ALTER TABLE sprints
  MODIFY COLUMN team_id INT NOT NULL;

ALTER TABLE sprints
  ADD CONSTRAINT fk_sprints_team_id
    FOREIGN KEY (team_id) REFERENCES teams(id)
    ON DELETE CASCADE;

ALTER TABLE sprints
  ADD INDEX idx_sprints_team_status (team_id, status);

-- 2) Make tasks team-owned (project kept for compatibility/reporting)
ALTER TABLE tasks
  ADD COLUMN team_id INT NULL AFTER project_id;

UPDATE tasks t
INNER JOIN projects p ON p.id = t.project_id
SET t.team_id = p.team_id
WHERE t.team_id IS NULL;

ALTER TABLE tasks
  MODIFY COLUMN team_id INT NOT NULL;

ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_team_id
    FOREIGN KEY (team_id) REFERENCES teams(id)
    ON DELETE CASCADE;

ALTER TABLE tasks
  ADD INDEX idx_tasks_team_status (team_id, status);

ALTER TABLE tasks
  ADD INDEX idx_tasks_team_sprint (team_id, sprint_id);

-- 3) Move kanban limits to team scope
ALTER TABLE kanban_column_limits
  ADD COLUMN team_id INT NULL AFTER project_id;

UPDATE kanban_column_limits k
INNER JOIN projects p ON p.id = k.project_id
SET k.team_id = p.team_id
WHERE k.team_id IS NULL;

ALTER TABLE kanban_column_limits
  MODIFY COLUMN team_id INT NOT NULL;

ALTER TABLE kanban_column_limits
  ADD CONSTRAINT fk_kcl_team_id
    FOREIGN KEY (team_id) REFERENCES teams(id)
    ON DELETE CASCADE;

ALTER TABLE kanban_column_limits
  ADD UNIQUE KEY uq_kcl_team_column (team_id, column_name);

ALTER TABLE kanban_column_limits
  ADD INDEX idx_kcl_team_column (team_id, column_name);

-- 4) Reset existing boards data (requested)
DELETE FROM sprints;

UPDATE tasks
SET sprint_id = NULL;

DELETE FROM kanban_column_limits;
