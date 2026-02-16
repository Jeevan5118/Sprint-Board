const db = require('../config/database');

class Comment {
  static async create(commentData) {
    const { task_id, user_id, content } = commentData;
    const [result] = await db.query(
      'INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)',
      [task_id, user_id, content]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT c.*, 
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.avatar_url as user_avatar
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async getByTaskId(taskId) {
    const [rows] = await db.query(
      `SELECT c.*, 
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.avatar_url as user_avatar
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.task_id = ?
       ORDER BY c.created_at DESC`,
      [taskId]
    );
    return rows;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM comments WHERE id = ?', [id]);
    return result.affectedRows;
  }
}

module.exports = Comment;
