const db = require('../config/database');

class Team {
  static async create(teamData) {
    const { name, description, team_lead_id } = teamData;
    const [result] = await db.query(
      'INSERT INTO teams (name, description, team_lead_id) VALUES (?, ?, ?)',
      [name, description, team_lead_id]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT t.*, 
        CONCAT(u.first_name, ' ', u.last_name) as team_lead_name,
        u.email as team_lead_email
       FROM teams t
       LEFT JOIN users u ON t.team_lead_id = u.id
       WHERE t.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async getAll() {
    const [rows] = await db.query(
      `SELECT t.*, 
        CONCAT(u.first_name, ' ', u.last_name) as team_lead_name,
        (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
       FROM teams t
       LEFT JOIN users u ON t.team_lead_id = u.id
       ORDER BY t.created_at DESC`
    );
    return rows;
  }

  static async getTeamsByUserId(userId) {
    const [rows] = await db.query(
      `SELECT t.*,
        CONCAT(u.first_name, ' ', u.last_name) as team_lead_name,
        (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
       FROM team_members tm
       JOIN teams t ON tm.team_id = t.id
       LEFT JOIN users u ON t.team_lead_id = u.id
       WHERE tm.user_id = ?
       ORDER BY t.created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async getTeamMembers(teamId) {
    const [rows] = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.avatar_url, tm.joined_at
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = ?
       ORDER BY tm.joined_at DESC`,
      [teamId]
    );
    return rows;
  }

  static async addMember(teamId, userId) {
    const [result] = await db.query(
      'INSERT INTO team_members (team_id, user_id) VALUES (?, ?)',
      [teamId, userId]
    );
    return result.insertId;
  }

  static async removeMember(teamId, userId) {
    const [result] = await db.query(
      'DELETE FROM team_members WHERE team_id = ? AND user_id = ?',
      [teamId, userId]
    );
    return result.affectedRows;
  }

  static async isMemberExists(teamId, userId) {
    const [rows] = await db.query(
      'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?',
      [teamId, userId]
    );
    return rows.length > 0;
  }
}

module.exports = Team;
