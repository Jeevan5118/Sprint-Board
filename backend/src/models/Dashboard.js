const db = require('../config/database');

class Dashboard {
  static async getSprintStats(sprintId) {
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
        (COUNT(*) - SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END)) as pending_tasks,
        SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'in_review' THEN 1 ELSE 0 END) as in_review_tasks,
        COALESCE(SUM(story_points), 0) as total_story_points,
        COALESCE(SUM(CASE WHEN status = 'done' THEN story_points ELSE 0 END), 0) as completed_story_points,
        CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND(
            (SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2
          )
        END as progress_percentage
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
        (COUNT(*) - SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END)) as pending_tasks,
        COALESCE(SUM(story_points), 0) as total_story_points,
        COALESCE(SUM(CASE WHEN status = 'done' THEN story_points ELSE 0 END), 0) as completed_story_points,
        CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND(
            (SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2
          )
        END as progress_percentage
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
        (COUNT(*) - SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END)) as pending_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks
       FROM tasks
       WHERE assigned_to = ?`,
      [userId]
    );
    return rows[0];
  }

  static async getTeamScopeStats(userId) {
    const [rows] = await db.query(
      `SELECT
        COUNT(*) as total_tasks,
        SUM(CASE WHEN tsk.status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
        (COUNT(*) - SUM(CASE WHEN tsk.status = 'done' THEN 1 ELSE 0 END)) as pending_tasks,
        SUM(CASE WHEN tsk.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks
       FROM tasks tsk
       INNER JOIN projects p ON p.id = tsk.project_id
       WHERE p.team_id IN (
         SELECT DISTINCT team_id
         FROM (
           SELECT tm.team_id
           FROM team_members tm
           WHERE tm.user_id = ?
           UNION
           SELECT t.id as team_id
           FROM teams t
           WHERE t.team_lead_id = ?
         ) x
       )`,
      [userId, userId]
    );
    return rows[0];
  }

  static async getTeamStats(teamId) {
    const [rows] = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM projects p WHERE p.team_id = ?) as total_projects,
        (SELECT COUNT(*) FROM sprints s INNER JOIN projects p ON p.id = s.project_id WHERE p.team_id = ?) as total_sprints,
        (SELECT COUNT(*) FROM sprints s INNER JOIN projects p ON p.id = s.project_id WHERE p.team_id = ? AND s.status = 'active') as active_sprints,
        (SELECT COUNT(*) FROM tasks t INNER JOIN projects p ON p.id = t.project_id WHERE p.team_id = ?) as total_tasks,
        (SELECT SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) FROM tasks t INNER JOIN projects p ON p.id = t.project_id WHERE p.team_id = ?) as completed_tasks`,
      [teamId, teamId, teamId, teamId, teamId]
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
        (COUNT(tsk.id) - SUM(CASE WHEN tsk.status = 'done' THEN 1 ELSE 0 END)) as pending_tasks
      FROM projects p
      INNER JOIN teams t ON p.team_id = t.id
      LEFT JOIN tasks tsk ON tsk.project_id = p.id
    `;

    const params = [];
    if (user.role !== 'admin') {
      query += `
        WHERE (
          EXISTS (
            SELECT 1
            FROM team_members tm
            WHERE tm.team_id = t.id AND tm.user_id = ?
          )
          OR t.team_lead_id = ?
        )
      `;
      params.push(user.id, user.id);
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
