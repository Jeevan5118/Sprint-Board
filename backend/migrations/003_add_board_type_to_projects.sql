ALTER TABLE projects
  ADD COLUMN board_type ENUM('scrum', 'kanban') NOT NULL DEFAULT 'scrum' AFTER status;

UPDATE projects
SET board_type = 'scrum'
WHERE board_type IS NULL;
