const db = require('../config/database');

class Sprint {
  static async create(sprintData) {
    const { name, goal, project_id, start_date, end_date } = sprintData;
    const [result] = await db.query(
      'INSERT INTO sprints (name, goal, project_id, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, goal, project_id, start_date, end_date, 'planned']
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT s.*, p.name as project_name, p.key_code as project_key
       FROM sprints s
       LEFT JOIN projects p ON s.project_id = p.id
       WHERE s.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async getByProjectId(projectId) {
    const [rows] = await db.query(
      `SELECT s.*, 
        (SELECT COUNT(*) FROM tasks WHERE sprint_id = s.id) as task_count
       FROM sprints s
       WHERE s.project_id = ?
       ORDER BY s.created_at DESC`,
      [projectId]
    );
    return rows;
  }

  static async updateStatus(id, status) {
    const [result] = await db.query(
      'UPDATE sprints SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows;
  }

  static async hasActiveSprint(projectId) {
    const [rows] = await db.query(
      'SELECT id FROM sprints WHERE project_id = ? AND status = ?',
      [projectId, 'active']
    );
    return rows.length > 0;
  }
}

module.exports = Sprint;
