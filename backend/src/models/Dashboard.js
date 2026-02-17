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

  static async getTeamProjectProgress(user) {
    let query = `
      SELECT
        t.id as team_id,
        t.name as team_name,
        p.id as project_id,
        p.name as project_name,
        p.key_code as project_key,
        COUNT(tsk.id) as total_tasks,
        SUM(CASE WHEN tsk.status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN tsk.status != 'done' THEN 1 ELSE 0 END) as pending_tasks
      FROM projects p
      INNER JOIN teams t ON p.team_id = t.id
      LEFT JOIN tasks tsk ON tsk.project_id = p.id
    `;

    const params = [];
    if (user.role !== 'admin') {
      query += ' INNER JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = ? ';
      params.push(user.id);
    }

    query += `
      GROUP BY t.id, t.name, p.id, p.name, p.key_code
      ORDER BY t.name ASC, p.name ASC
    `;

    const [rows] = await db.query(query, params);
    return rows;
  }
}

module.exports = Dashboard;
