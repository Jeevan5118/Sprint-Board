const db = require('../config/database');

class Task {
  static async create(taskData) {
    const { title, description, task_key, sprint_id, project_id, assigned_to, reporter_id, status, type, priority, story_points, estimated_hours, due_date } = taskData;
    const [result] = await db.query(
      'INSERT INTO tasks (title, description, task_key, sprint_id, project_id, assigned_to, reporter_id, status, type, priority, story_points, estimated_hours, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, task_key, sprint_id, project_id, assigned_to, reporter_id, status, type, priority, story_points, estimated_hours, due_date]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT t.*, 
        p.name as project_name, p.key_code as project_key,
        s.name as sprint_name,
        CONCAT(u1.first_name, ' ', u1.last_name) as assigned_to_name,
        CONCAT(u2.first_name, ' ', u2.last_name) as reporter_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN sprints s ON t.sprint_id = s.id
       LEFT JOIN users u1 ON t.assigned_to = u1.id
       LEFT JOIN users u2 ON t.reporter_id = u2.id
       WHERE t.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async getBySprintId(sprintId) {
    const [rows] = await db.query(
      `SELECT t.*, 
        CONCAT(u1.first_name, ' ', u1.last_name) as assigned_to_name,
        CONCAT(u2.first_name, ' ', u2.last_name) as reporter_name
       FROM tasks t
       LEFT JOIN users u1 ON t.assigned_to = u1.id
       LEFT JOIN users u2 ON t.reporter_id = u2.id
       WHERE t.sprint_id = ?
       ORDER BY t.created_at DESC`,
      [sprintId]
    );
    return rows;
  }

  static async getByProjectId(projectId) {
    const [rows] = await db.query(
      `SELECT t.*, 
        s.name as sprint_name,
        s.status as sprint_status,
        CONCAT(u1.first_name, ' ', u1.last_name) as assigned_to_name,
        CONCAT(u2.first_name, ' ', u2.last_name) as reporter_name
       FROM tasks t
       LEFT JOIN sprints s ON t.sprint_id = s.id
       LEFT JOIN users u1 ON t.assigned_to = u1.id
       LEFT JOIN users u2 ON t.reporter_id = u2.id
       WHERE t.project_id = ?
       ORDER BY t.created_at DESC`,
      [projectId]
    );
    return rows;
  }

  static async getByAssigneeAndTeam(userId, teamId) {
    const [rows] = await db.query(
      `SELECT t.id, t.task_key, t.title, t.status, t.priority, t.type, t.story_points,
              t.project_id, p.name as project_name, p.key_code as project_key,
              t.sprint_id, s.name as sprint_name, t.created_at, t.updated_at
       FROM tasks t
       INNER JOIN projects p ON t.project_id = p.id
       LEFT JOIN sprints s ON t.sprint_id = s.id
       WHERE t.assigned_to = ? AND p.team_id = ?
       ORDER BY p.name ASC, t.updated_at DESC`,
      [userId, teamId]
    );
    return rows;
  }

  static async update(id, taskData, executor = db) {
    const fields = [];
    const values = [];

    Object.keys(taskData).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(taskData[key]);
    });

    values.push(id);
    const [result] = await executor.query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows;
  }

  static async findStatusById(id, executor = db) {
    const [rows] = await executor.query('SELECT status FROM tasks WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async insertStatusHistory(taskId, fromStatus, toStatus, changedBy, executor = db) {
    const [result] = await executor.query(
      'INSERT INTO task_status_history (task_id, from_status, to_status, changed_by) VALUES (?, ?, ?, ?)',
      [taskId, fromStatus, toStatus, changedBy]
    );
    return result.insertId;
  }

  static async updateStatus(id, status, executor = db) {
    const [result] = await executor.query('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
    return result.affectedRows;
  }

  static async getKanbanColumnLimit(projectId, columnName, executor = db) {
    const [rows] = await executor.query(
      'SELECT wip_limit FROM kanban_column_limits WHERE project_id = ? AND column_name = ? LIMIT 1',
      [projectId, columnName]
    );
    return rows[0] || null;
  }

  static async countTasksByProjectAndStatus(projectId, status, executor = db) {
    const [rows] = await executor.query(
      'SELECT COUNT(*) AS total FROM tasks WHERE project_id = ? AND status = ?',
      [projectId, status]
    );
    return Number(rows[0]?.total || 0);
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM tasks WHERE id = ?', [id]);
    return result.affectedRows;
  }

  static async isTaskKeyExists(taskKey) {
    const [rows] = await db.query('SELECT id FROM tasks WHERE task_key = ?', [taskKey]);
    return rows.length > 0;
  }

  static async addLink(taskId, linkData) {
    const { url, title, description, added_by } = linkData;
    const [result] = await db.query(
      'INSERT INTO task_links (task_id, url, title, description, added_by) VALUES (?, ?, ?, ?, ?)',
      [taskId, url, title, description, added_by]
    );
    return result.insertId;
  }

  static async getLinks(taskId) {
    const [rows] = await db.query(
      `SELECT tl.*, CONCAT(u.first_name, ' ', u.last_name) as added_by_name
       FROM task_links tl
       LEFT JOIN users u ON tl.added_by = u.id
       WHERE tl.task_id = ?`,
      [taskId]
    );
    return rows;
  }

  static async addAttachment(taskId, attachmentData) {
    const { file_name, file_path, file_size, file_type, uploaded_by } = attachmentData;
    const [result] = await db.query(
      'INSERT INTO task_attachments (task_id, file_name, file_path, file_size, file_type, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)',
      [taskId, file_name, file_path, file_size, file_type, uploaded_by]
    );
    return result.insertId;
  }

  static async getAttachments(taskId) {
    const [rows] = await db.query(
      `SELECT ta.*, CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name
       FROM task_attachments ta
       LEFT JOIN users u ON ta.uploaded_by = u.id
       WHERE ta.task_id = ?`,
      [taskId]
    );
    return rows;
  }

  static async getAttachmentById(attachmentId) {
    const [rows] = await db.query(
      `SELECT ta.*
       FROM task_attachments ta
       WHERE ta.id = ?`,
      [attachmentId]
    );
    return rows[0] || null;
  }

  static async deleteAttachmentById(attachmentId) {
    const [result] = await db.query(
      'DELETE FROM task_attachments WHERE id = ?',
      [attachmentId]
    );
    return result.affectedRows;
  }
}

module.exports = Task;
