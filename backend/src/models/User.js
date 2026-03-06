const db = require('../config/database');

class User {
  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT id, email, first_name, last_name, role, avatar_url, is_active, created_at FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(userData) {
    const { email, password, first_name, last_name, role = 'member' } = userData;
    const [result] = await db.query(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      [email, password, first_name, last_name, role]
    );
    return result.insertId;
  }

  static async countAdmins() {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
    return rows[0].count;
  }

  static async getAll() {
    const [rows] = await db.query('SELECT id, email, first_name, last_name, role, avatar_url, is_active, created_at FROM users');
    return rows;
  }

  static async updateRole(id, role) {
    const [result] = await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    return result.affectedRows;
  }

  static async isEmailTakenByAnotherUser(email, userId) {
    const [rows] = await db.query(
      'SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1',
      [email, userId]
    );
    return rows.length > 0;
  }

  static async updateCredentials(id, payload) {
    const fields = [];
    const values = [];

    if (Object.prototype.hasOwnProperty.call(payload, 'email')) {
      fields.push('email = ?');
      values.push(payload.email);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'password')) {
      fields.push('password = ?');
      values.push(payload.password);
    }

    if (fields.length === 0) {
      return 0;
    }

    values.push(id);
    const [result] = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows;
  }
}

module.exports = User;
