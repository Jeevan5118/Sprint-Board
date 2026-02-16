const Dashboard = require('../models/Dashboard');
const Sprint = require('../models/Sprint');
const Project = require('../models/Project');
const Team = require('../models/Team');

class DashboardService {
  static async getSprintDashboard(sprintId, user) {
    // Validate sprint exists and user has access
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      throw { statusCode: 404, message: 'Sprint not found' };
    }

    const project = await Project.findById(sprint.project_id);
    if (user.role !== 'admin') {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(project.team_id)) {
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
    const stats = await Dashboard.getUserStats(user.id);

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
}

module.exports = DashboardService;
