const db = require('../config/database');
const Task = require('../models/Task');
const Project = require('../models/Project');
const NotificationService = require('./notificationService');
const { isAdmin, canManageProject } = require('../utils/permissions');

class TimeLogService {
  static async ensureTeamAccess(project, user) {
    if (isAdmin(user)) {
      return;
    }

    const userTeams = await Project.getUserTeams(user.id);
    if (!userTeams.includes(project.team_id)) {
      throw { statusCode: 403, message: 'Access denied.' };
    }
  }

  static async createTimeLog(taskId, payload, user) {
    const normalizedTaskId = Number(taskId);
    const hours = Number(payload.hours);
    const description = payload.description || null;

    if (!Number.isInteger(normalizedTaskId) || normalizedTaskId <= 0) {
      throw { statusCode: 400, message: 'Task ID must be a valid number' };
    }

    if (!Number.isFinite(hours) || hours <= 0) {
      throw { statusCode: 400, message: 'Hours must be greater than 0' };
    }

    const task = await Task.findById(normalizedTaskId);
    if (!task) {
      throw { statusCode: 404, message: 'Task not found' };
    }

    const project = await Project.findById(task.project_id);
    await this.ensureTeamAccess(project, user);

    const [result] = await db.query(
      `INSERT INTO task_time_logs (task_id, user_id, hours, description)
       VALUES (?, ?, ?, ?)`,
      [normalizedTaskId, user.id, hours, description]
    );

    const [rows] = await db.query(
      `SELECT ttl.id, ttl.task_id, ttl.user_id, ttl.hours, ttl.description, ttl.logged_at,
              CONCAT(u.first_name, ' ', u.last_name) AS user_name
       FROM task_time_logs ttl
       LEFT JOIN users u ON u.id = ttl.user_id
       WHERE ttl.id = ?`,
      [result.insertId]
    );

    if (task.assigned_to && Number(task.assigned_to) !== Number(user.id)) {
      await NotificationService.notifyTaskTimeLogged(task.assigned_to, task, hours, user);
    }

    return rows[0];
  }

  static async getTaskTimeLogs(taskId, user) {
    const normalizedTaskId = Number(taskId);
    if (!Number.isInteger(normalizedTaskId) || normalizedTaskId <= 0) {
      throw { statusCode: 400, message: 'Task ID must be a valid number' };
    }

    const task = await Task.findById(normalizedTaskId);
    if (!task) {
      throw { statusCode: 404, message: 'Task not found' };
    }

    const project = await Project.findById(task.project_id);
    await this.ensureTeamAccess(project, user);

    try {
      const [rows] = await db.query(
        `SELECT ttl.id, ttl.task_id, ttl.user_id, ttl.hours, ttl.description, ttl.logged_at,
                CONCAT(u.first_name, ' ', u.last_name) AS user_name
         FROM task_time_logs ttl
         LEFT JOIN users u ON u.id = ttl.user_id
         WHERE ttl.task_id = ?
         ORDER BY ttl.logged_at DESC`,
        [normalizedTaskId]
      );

      return rows;
    } catch (error) {
      if (error?.code === 'ER_NO_SUCH_TABLE') {
        console.warn('[time_log_table_missing]', { table: 'task_time_logs', taskId: normalizedTaskId });
        return [];
      }
      throw error;
    }
  }

  static async deleteTimeLog(timeLogId, user) {
    const normalizedTimeLogId = Number(timeLogId);
    if (!Number.isInteger(normalizedTimeLogId) || normalizedTimeLogId <= 0) {
      throw { statusCode: 400, message: 'Time log ID must be a valid number' };
    }

    const [rows] = await db.query(
      'SELECT id, task_id, user_id FROM task_time_logs WHERE id = ?',
      [normalizedTimeLogId]
    );
    const timeLog = rows[0];
    if (!timeLog) {
      throw { statusCode: 404, message: 'Time log not found' };
    }

    if (!isAdmin(user) && Number(timeLog.user_id) !== Number(user.id)) {
      const task = await Task.findById(timeLog.task_id);
      if (!task) {
        throw { statusCode: 404, message: 'Task not found' };
      }

      const project = await Project.findById(task.project_id);
      const canManage = await canManageProject(project, user);
      if (!canManage) {
        throw { statusCode: 403, message: 'You can only delete your own time logs' };
      }
    }

    await db.query('DELETE FROM task_time_logs WHERE id = ?', [normalizedTimeLogId]);
    return { message: 'Time log deleted successfully' };
  }
}

module.exports = TimeLogService;
