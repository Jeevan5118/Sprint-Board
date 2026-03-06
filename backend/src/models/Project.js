const db = require('../config/database');

class Project {
  static async create(projectData) {
    const { name, key_code, description, team_id, created_by, start_date, end_date } = projectData;
    const boardType = projectData.board_type || 'scrum';

    if (!['scrum', 'kanban'].includes(boardType)) {
      throw { statusCode: 400, message: 'Invalid board_type. Allowed values: scrum, kanban' };
    }

    const [result] = await db.query(
      'INSERT INTO projects (name, key_code, description, team_id, created_by, start_date, end_date, board_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, key_code, description, team_id, created_by, start_date, end_date, boardType]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT p.*, 
        t.name as team_name,
        t.team_lead_id as team_lead_id,
        CONCAT(tl.first_name, ' ', tl.last_name) as team_lead_name,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
       FROM projects p
       LEFT JOIN teams t ON p.team_id = t.id
       LEFT JOIN users tl ON t.team_lead_id = tl.id
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
        t.team_lead_id as team_lead_id,
        CONCAT(tl.first_name, ' ', tl.last_name) as team_lead_name,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
       FROM projects p
       LEFT JOIN teams t ON p.team_id = t.id
       LEFT JOIN users tl ON t.team_lead_id = tl.id
       LEFT JOIN users u ON p.created_by = u.id
       ORDER BY p.created_at DESC`
    );
    return rows;
  }

  static async getByTeamId(teamId) {
    const [rows] = await db.query(
      `SELECT p.*, 
        t.name as team_name,
        t.team_lead_id as team_lead_id,
        CONCAT(tl.first_name, ' ', tl.last_name) as team_lead_name,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
       FROM projects p
       LEFT JOIN teams t ON p.team_id = t.id
       LEFT JOIN users tl ON t.team_lead_id = tl.id
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.team_id = ?
       ORDER BY p.created_at DESC`,
      [teamId]
    );
    return rows;
  }

  static async getUserTeams(userId) {
    const [rows] = await db.query(
      `SELECT DISTINCT team_id
       FROM (
         SELECT tm.team_id
         FROM team_members tm
         WHERE tm.user_id = ?
         UNION
         SELECT t.id as team_id
         FROM teams t
         WHERE t.team_lead_id = ?
       ) x`,
      [userId, userId]
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
