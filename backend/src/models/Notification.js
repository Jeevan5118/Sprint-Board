const db = require('../config/database');

class Notification {
  static tableEnsured = false;
  static allowedTypes = [
    'task_assigned',
    'task_status_changed',
    'task_commented',
    'task_time_logged'
  ];

  static async ensureTable() {
    if (this.tableEnsured) return;
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        task_id INT NOT NULL,
        type ENUM('task_assigned','task_status_changed','task_commented','task_time_logged') DEFAULT 'task_assigned',
        message VARCHAR(500) NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        INDEX idx_notifications_user (user_id),
        INDEX idx_notifications_read (is_read),
        INDEX idx_notifications_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    // Ensure enum is expanded even if table existed from older schema.
    await db.query(`
      ALTER TABLE notifications
      MODIFY COLUMN type ENUM('task_assigned','task_status_changed','task_commented','task_time_logged')
      DEFAULT 'task_assigned'
    `);
    this.tableEnsured = true;
  }

  static async create({ user_id, task_id, type, message }) {
    await this.ensureTable();
    const notificationType = this.allowedTypes.includes(type) ? type : 'task_assigned';
    const [result] = await db.query(
      'INSERT INTO notifications (user_id, task_id, type, message) VALUES (?, ?, ?, ?)',
      [user_id, task_id, notificationType, message]
    );
    return result.insertId;
  }

  static async getUnreadByUserId(userId) {
    await this.ensureTable();
    const [rows] = await db.query(
      `SELECT n.id, n.task_id, n.type, n.message, n.is_read, n.created_at,
              t.task_key, t.title as task_title
       FROM notifications n
       LEFT JOIN tasks t ON t.id = n.task_id
       WHERE n.user_id = ? AND n.is_read = FALSE
       ORDER BY n.created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async markAsRead(notificationId, userId) {
    await this.ensureTable();
    const [result] = await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    return result.affectedRows;
  }

  static async markAllAsRead(userId) {
    await this.ensureTable();
    const [result] = await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return result.affectedRows;
  }
}

module.exports = Notification;
