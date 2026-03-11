const Dashboard = require('../models/Dashboard');
const Sprint = require('../models/Sprint');
const Project = require('../models/Project');
const Team = require('../models/Team');

class DashboardService {
  static normalizeDeadlineLabel(daysRemaining) {
    const d = Number(daysRemaining);
    if (d < 0) return `Overdue by ${Math.abs(d)} day${Math.abs(d) === 1 ? '' : 's'}`;
    if (d === 0) return 'Due today';
    if (d === 1) return 'Due tomorrow';
    return `Due in ${d} days`;
  }
  static async getSprintDashboard(sprintId, user) {
    // Validate sprint exists and user has access
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      throw { statusCode: 404, message: 'Sprint not found' };
    }

    if (user.role !== 'admin') {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(sprint.team_id)) {
        throw { statusCode: 403, message: 'Access denied.' };
      }
    }

    const stats = await Dashboard.getSprintStats(sprintId);

    return {
      sprint: {
        id: sprint.id,
        name: sprint.name,
        status: sprint.status,
        start_date: sprint.start_date,
        end_date: sprint.end_date
      },
      stats: {
        total_tasks: stats.total_tasks || 0,
        completed_tasks: stats.completed_tasks || 0,
        pending_tasks: stats.pending_tasks || 0,
        todo_tasks: stats.todo_tasks || 0,
        in_progress_tasks: stats.in_progress_tasks || 0,
        in_review_tasks: stats.in_review_tasks || 0,
        total_story_points: stats.total_story_points || 0,
        completed_story_points: stats.completed_story_points || 0,
        progress_percentage: stats.progress_percentage || 0
      }
    };
  }

  static async getProjectDashboard(projectId, user) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw { statusCode: 404, message: 'Project not found' };
    }

    if (user.role !== 'admin') {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(project.team_id)) {
        throw { statusCode: 403, message: 'Access denied.' };
      }
    }

    const stats = await Dashboard.getProjectStats(projectId);

    return {
      project: {
        id: project.id,
        name: project.name,
        key_code: project.key_code,
        status: project.status
      },
      stats: {
        total_tasks: stats.total_tasks || 0,
        completed_tasks: stats.completed_tasks || 0,
        pending_tasks: stats.pending_tasks || 0,
        total_story_points: stats.total_story_points || 0,
        completed_story_points: stats.completed_story_points || 0,
        progress_percentage: stats.progress_percentage || 0
      }
    };
  }

  static async getUserDashboard(user) {
    let stats = await Dashboard.getUserStats(user.id);
    if (user.role !== 'admin') {
      const teamStats = await Dashboard.getTeamScopeStats(user.id);
      const hasTeamScopeData = (teamStats?.total_tasks || 0) > 0;
      if (hasTeamScopeData) {
        stats = {
          assigned_tasks: teamStats.total_tasks || 0,
          completed_tasks: teamStats.completed_tasks || 0,
          pending_tasks: teamStats.pending_tasks || 0,
          in_progress_tasks: teamStats.in_progress_tasks || 0
        };
      }
    }

    return {
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email
      },
      stats: {
        assigned_tasks: stats.assigned_tasks || 0,
        completed_tasks: stats.completed_tasks || 0,
        pending_tasks: stats.pending_tasks || 0,
        in_progress_tasks: stats.in_progress_tasks || 0
      }
    };
  }

  static async getTeamDashboard(teamId, user) {
    const team = await Team.findById(teamId);
    if (!team) {
      throw { statusCode: 404, message: 'Team not found' };
    }

    if (user.role !== 'admin') {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(teamId)) {
        throw { statusCode: 403, message: 'Access denied.' };
      }
    }

    const stats = await Dashboard.getTeamStats(teamId);

    return {
      team: {
        id: team.id,
        name: team.name
      },
      stats: {
        total_projects: stats.total_projects || 0,
        total_sprints: stats.total_sprints || 0,
        active_sprints: stats.active_sprints || 0,
        total_tasks: stats.total_tasks || 0,
        completed_tasks: stats.completed_tasks || 0
      }
    };
  }

  static async getTeamProjectProgress(user) {
    const rows = await Dashboard.getTeamProjectProgress(user);
    const teamMap = new Map();

    rows.forEach((row) => {
      if (!teamMap.has(row.team_id)) {
        teamMap.set(row.team_id, {
          id: row.team_id,
          name: row.team_name,
          projects: []
        });
      }

      const totalTasks = row.total_tasks || 0;
      const completedTasks = row.completed_tasks || 0;
      const pendingTasks = row.pending_tasks || 0;
      const progressPercentage =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      teamMap.get(row.team_id).projects.push({
        id: row.project_id,
        name: row.project_name,
        key_code: row.project_key,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        pending_tasks: pendingTasks,
        progress_percentage: progressPercentage
      });
    });

    return {
      teams: Array.from(teamMap.values())
    };
  }

  static async getDeadlineAlerts(user, upcomingDays = 3) {
    const [taskRows, sprintRows] = await Promise.all([
      Dashboard.getDeadlineAlertTasks(user, upcomingDays),
      Dashboard.getDeadlineAlertSprints(user, upcomingDays)
    ]);

    const tasks = taskRows.map((row) => ({
      task_id: row.task_id,
      task_key: row.task_key,
      task_title: row.task_title,
      project_id: row.project_id,
      team_id: row.team_id,
      project_name: row.project_name,
      project_key: row.project_key,
      sprint_id: row.sprint_id,
      sprint_name: row.sprint_name,
      due_date: row.due_date,
      days_remaining: Number(row.days_remaining),
      alert_type: Number(row.days_remaining) < 0 ? 'overdue' : 'upcoming',
      alert_label: this.normalizeDeadlineLabel(row.days_remaining)
    }));

    const sprints = sprintRows.map((row) => ({
      sprint_id: row.sprint_id,
      sprint_name: row.sprint_name,
      sprint_status: row.sprint_status,
      project_id: row.project_id,
      team_id: row.team_id,
      project_name: row.project_name,
      project_key: row.project_key,
      end_date: row.end_date,
      days_remaining: Number(row.days_remaining),
      alert_type: Number(row.days_remaining) < 0 ? 'overdue' : 'upcoming',
      alert_label: this.normalizeDeadlineLabel(row.days_remaining)
    }));

    return {
      window_days: upcomingDays,
      summary: {
        overdue_tasks: tasks.filter((t) => t.alert_type === 'overdue').length,
        upcoming_tasks: tasks.filter((t) => t.alert_type === 'upcoming').length,
        overdue_sprints: sprints.filter((s) => s.alert_type === 'overdue').length,
        upcoming_sprints: sprints.filter((s) => s.alert_type === 'upcoming').length
      },
      tasks,
      sprints
    };
  }
}

module.exports = DashboardService;
