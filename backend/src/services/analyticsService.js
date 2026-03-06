const db = require('../config/database');
const Project = require('../models/Project');
const { isAdmin } = require('../utils/permissions');

class AnalyticsService {
  static async ensureProjectAccess(projectId, user) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw { statusCode: 404, message: 'Project not found' };
    }

    if (!isAdmin(user)) {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(project.team_id)) {
        throw { statusCode: 403, message: 'Access denied.' };
      }
    }

    return project;
  }

  static async getKanbanAnalytics(projectId, user) {
    const normalizedProjectId = Number(projectId);
    if (!Number.isInteger(normalizedProjectId) || normalizedProjectId <= 0) {
      throw { statusCode: 400, message: 'Project ID must be a valid number' };
    }

    await this.ensureProjectAccess(normalizedProjectId, user);

    const [avgLeadTimeHours, avgCycleTimeHours, throughputWeekly, totalLoggedHours, wipCounts] = await Promise.all([
      this.calculateLeadTime(normalizedProjectId),
      this.calculateCycleTime(normalizedProjectId),
      this.calculateThroughputWeekly(normalizedProjectId),
      this.calculateTotalLoggedHours(normalizedProjectId),
      this.getWipCounts(normalizedProjectId)
    ]);

    return {
      avgLeadTimeHours,
      avgCycleTimeHours,
      throughputWeekly,
      totalLoggedHours,
      wipCounts
    };
  }

  static async calculateLeadTime(projectId) {
    const normalizedProjectId = Number(projectId);
    const [leadRows] = await db.query(
      `SELECT ROUND(AVG(TIMESTAMPDIFF(SECOND, t.created_at, d.done_at)) / 3600, 2) AS avgLeadTimeHours
       FROM (
         SELECT id, created_at
         FROM tasks
         WHERE project_id = ? AND sprint_id IS NULL
       ) t
       INNER JOIN (
         SELECT h.task_id, MIN(CASE WHEN h.to_status = 'done' THEN h.changed_at END) AS done_at
         FROM task_status_history h
         INNER JOIN (
           SELECT id
           FROM tasks
           WHERE project_id = ? AND sprint_id IS NULL
         ) pt ON pt.id = h.task_id
         WHERE h.to_status = 'done'
         GROUP BY h.task_id
       ) d ON d.task_id = t.id
       WHERE d.done_at IS NOT NULL`,
      [normalizedProjectId, normalizedProjectId]
    );
    return leadRows[0]?.avgLeadTimeHours !== null ? Number(leadRows[0].avgLeadTimeHours) : 0;
  }

  static async calculateCycleTime(projectId) {
    const normalizedProjectId = Number(projectId);
    const [cycleRows] = await db.query(
      `SELECT ROUND(AVG(TIMESTAMPDIFF(SECOND, d.in_progress_at, d.done_at)) / 3600, 2) AS avgCycleTimeHours
       FROM (
         SELECT id
         FROM tasks
         WHERE project_id = ? AND sprint_id IS NULL
       ) t
       INNER JOIN (
         SELECT h.task_id,
                MIN(CASE WHEN h.to_status = 'in_progress' THEN h.changed_at END) AS in_progress_at,
                MIN(CASE WHEN h.to_status = 'done' THEN h.changed_at END) AS done_at
         FROM task_status_history h
         INNER JOIN (
           SELECT id
           FROM tasks
           WHERE project_id = ? AND sprint_id IS NULL
         ) pt ON pt.id = h.task_id
         WHERE h.to_status IN ('in_progress', 'done')
         GROUP BY h.task_id
       ) d ON d.task_id = t.id
       WHERE d.in_progress_at IS NOT NULL
         AND d.done_at IS NOT NULL
         AND d.done_at >= d.in_progress_at`,
      [normalizedProjectId, normalizedProjectId]
    );
    return cycleRows[0]?.avgCycleTimeHours !== null ? Number(cycleRows[0].avgCycleTimeHours) : 0;
  }

  static async calculateThroughputWeekly(projectId) {
    const normalizedProjectId = Number(projectId);
    const [rows] = await db.query(
      `SELECT YEARWEEK(d.done_at, 3) AS yearWeek,
              MIN(DATE(d.done_at)) AS weekStartDate,
              COUNT(*) AS completedCount
       FROM (
         SELECT h.task_id, MIN(h.changed_at) AS done_at
         FROM task_status_history h
         INNER JOIN (
           SELECT id
           FROM tasks
           WHERE project_id = ? AND sprint_id IS NULL
         ) pt ON pt.id = h.task_id
         WHERE h.to_status = 'done'
         GROUP BY h.task_id
       ) d
       GROUP BY YEARWEEK(d.done_at, 3)
       ORDER BY YEARWEEK(d.done_at, 3) ASC`,
      [normalizedProjectId]
    );

    return rows.map((row) => ({
      yearWeek: Number(row.yearWeek),
      weekStartDate: row.weekStartDate,
      completedCount: Number(row.completedCount)
    }));
  }

  static async calculateTotalLoggedHours(projectId) {
    const normalizedProjectId = Number(projectId);
    const [rows] = await db.query(
      `SELECT ROUND(COALESCE(SUM(ttl.hours), 0), 2) AS totalLoggedHours
       FROM task_time_logs ttl
       INNER JOIN (
         SELECT id
         FROM tasks
         WHERE project_id = ? AND sprint_id IS NULL
       ) t ON t.id = ttl.task_id`,
      [normalizedProjectId]
    );
    return rows[0]?.totalLoggedHours !== null ? Number(rows[0].totalLoggedHours) : 0;
  }

  static async getWipCounts(projectId) {
    const normalizedProjectId = Number(projectId);
    const [rows] = await db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END), 0) AS todo,
         COALESCE(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), 0) AS in_progress,
         COALESCE(SUM(CASE WHEN status = 'in_review' THEN 1 ELSE 0 END), 0) AS in_review,
         COALESCE(SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END), 0) AS done
       FROM tasks
       WHERE project_id = ? AND sprint_id IS NULL`,
      [normalizedProjectId]
    );

    const row = rows[0] || {};
    return {
      todo: Number(row.todo || 0),
      in_progress: Number(row.in_progress || 0),
      in_review: Number(row.in_review || 0),
      done: Number(row.done || 0)
    };
  }
}

module.exports = AnalyticsService;
