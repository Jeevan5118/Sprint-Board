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
      `SELECT DISTINCT t.*,
        CONCAT(u.first_name, ' ', u.last_name) as team_lead_name,
        (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
       FROM teams t
       LEFT JOIN users u ON t.team_lead_id = u.id
       LEFT JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.user_id = ? OR t.team_lead_id = ?
       ORDER BY t.created_at DESC`,
      [userId, userId]
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

  static async updateTeamLead(teamId, userId) {
    const [result] = await db.query(
      'UPDATE teams SET team_lead_id = ? WHERE id = ?',
      [userId, teamId]
    );
    return result.affectedRows;
  }

  static async update(id, payload) {
    const fields = [];
    const values = [];

    if (Object.prototype.hasOwnProperty.call(payload, 'name')) {
      fields.push('name = ?');
      values.push(payload.name);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
      fields.push('description = ?');
      values.push(payload.description);
    }

    if (fields.length === 0) {
      return 0;
    }

    values.push(id);
    const [result] = await db.query(
      `UPDATE teams SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM teams WHERE id = ?', [id]);
    return result.affectedRows;
  }

  static async isMemberExists(teamId, userId) {
    const [rows] = await db.query(
      `SELECT id
       FROM team_members
       WHERE team_id = ? AND user_id = ?
       UNION
       SELECT t.id
       FROM teams t
       WHERE t.id = ? AND t.team_lead_id = ?`,
      [teamId, userId, teamId, userId]
    );
    return rows.length > 0;
  }

  static async isTeamLead(teamId, userId) {
    const [rows] = await db.query(
      `SELECT id
       FROM teams
       WHERE id = ? AND team_lead_id = ?`,
      [teamId, userId]
    );
    return rows.length > 0;
  }

  static async hasLedTeams(userId) {
    const [rows] = await db.query(
      `SELECT id
       FROM teams
       WHERE team_lead_id = ?
       LIMIT 1`,
      [userId]
    );
    return rows.length > 0;
  }

  static async getUsersNotInAnyTeam() {
    const [rows] = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.avatar_url, u.is_active
       FROM users u
       WHERE u.is_active = TRUE
         AND u.id NOT IN (
           SELECT tm.user_id FROM team_members tm
         )
         AND u.id NOT IN (
           SELECT t.team_lead_id FROM teams t WHERE t.team_lead_id IS NOT NULL
         )
       ORDER BY u.first_name ASC, u.last_name ASC`
    );
    return rows;
  }
}

module.exports = Team;
