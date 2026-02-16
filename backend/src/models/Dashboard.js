const db = require('../config/database');

class Dashboard {
  static async getSprintStats(sprintId) {
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status != 'done' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'in_review' THEN 1 ELSE 0 END) as in_review_tasks,
        SUM(story_points) as total_story_points,
        SUM(CASE WHEN status = 'done' THEN story_points ELSE 0 END) as completed_story_points,
        ROUND(
          (SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2
        ) as progress_percentage
       FROM tasks
       WHERE sprint_id = ?`,
      [sprintId]
    );
    return rows[0];
  }

  static async getProjectStats(projectId) {
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status != 'done' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(story_points) as total_story_points,
        SUM(CASE WHEN status = 'done' THEN story_points ELSE 0 END) as completed_story_points,
        ROUND(
          (SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2
        ) as progress_percentage
       FROM tasks
       WHERE project_id = ?`,
      [projectId]
    );
    return rows[0];
  }

  static async getUserStats(userId) {
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as assigned_tasks,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status != 'done' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks
       FROM tasks
       WHERE assigned_to = ?`,
      [userId]
    );
    return rows[0];
  }

  static async getTeamStats(teamId) {
    const [rows] = await db.query(
      `SELECT 
        COUNT(DISTINCT p.id) as total_projects,
        COUNT(DISTINCT s.id) as total_sprints,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) as active_sprints
       FROM projects p
       LEFT JOIN sprints s ON p.id = s.project_id
       LEFT JOIN tasks t ON p.id = t.project_id
       WHERE p.team_id = ?`,
      [teamId]
    );
    return rows[0];
  }
}

module.exports = Dashboard;
