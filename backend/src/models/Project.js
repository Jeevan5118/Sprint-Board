const db = require('../config/database');

class Project {
  static async create(projectData) {
    const { name, key_code, description, team_id, created_by, start_date, end_date } = projectData;
    const [result] = await db.query(
      'INSERT INTO projects (name, key_code, description, team_id, created_by, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, key_code, description, team_id, created_by, start_date, end_date]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT p.*, 
        t.name as team_name,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
       FROM projects p
       LEFT JOIN teams t ON p.team_id = t.id
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async getAll() {
    const [rows] = await db.query(
      `SELECT p.*, 
        t.name as team_name,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
       FROM projects p
       LEFT JOIN teams t ON p.team_id = t.id
       LEFT JOIN users u ON p.created_by = u.id
       ORDER BY p.created_at DESC`
    );
    return rows;
  }

  static async getByTeamId(teamId) {
    const [rows] = await db.query(
      `SELECT p.*, 
        t.name as team_name,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
       FROM projects p
       LEFT JOIN teams t ON p.team_id = t.id
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.team_id = ?
       ORDER BY p.created_at DESC`,
      [teamId]
    );
    return rows;
  }

  static async getUserTeams(userId) {
    const [rows] = await db.query(
      'SELECT team_id FROM team_members WHERE user_id = ?',
      [userId]
    );
    return rows.map(row => row.team_id);
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM projects WHERE id = ?', [id]);
    return result.affectedRows;
  }

  static async isKeyCodeExists(keyCode) {
    const [rows] = await db.query('SELECT id FROM projects WHERE key_code = ?', [keyCode]);
    return rows.length > 0;
  }
}

module.exports = Project;
