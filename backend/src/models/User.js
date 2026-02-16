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
}

module.exports = User;
