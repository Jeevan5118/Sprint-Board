const Sprint = require('../models/Sprint');
const Project = require('../models/Project');
const Team = require('../models/Team');
const { isAdmin, canManageTeam } = require('../utils/permissions');

class SprintService {
  static async createSprint(sprintData, user) {
    const { name, goal, team_id, project_id, start_date, end_date } = sprintData;
    const teamId = Number(team_id);

    const team = await Team.findById(teamId);
    if (!team) {
      throw { statusCode: 404, message: 'Team not found' };
    }

    const canManage = await canManageTeam(teamId, user);
    if (!canManage) {
      throw { statusCode: 403, message: 'Only admin or this team lead can create team sprints' };
    }

    let projectId = null;
    if (project_id) {
      const project = await Project.findById(project_id);
      if (!project || Number(project.team_id) !== teamId) {
        throw { statusCode: 400, message: 'Invalid project for this team' };
      }
      projectId = Number(project.id);
    } else {
      const teamProjects = await Project.getByTeamId(teamId);
      if (!teamProjects.length) {
        throw { statusCode: 400, message: 'Create at least one project in this team before creating sprints' };
      }
      projectId = Number(teamProjects[0].id);
    }

    const sprintId = await Sprint.create({ name, goal, project_id: projectId, team_id: teamId, start_date, end_date });
    return await Sprint.findById(sprintId);
  }

  static async getSprintsByProject(projectId, user) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw { statusCode: 404, message: 'Project not found' };
    }

    if (!isAdmin(user)) {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(project.team_id)) {
        throw { statusCode: 403, message: 'Access denied. You are not a member of this project\'s team.' };
      }
    }

    return await Sprint.getByProjectId(projectId);
  }

  static async getSprintsByTeam(teamId, user) {
    const team = await Team.findById(teamId);
    if (!team) {
      throw { statusCode: 404, message: 'Team not found' };
    }

    if (!isAdmin(user)) {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(team.id)) {
        throw { statusCode: 403, message: 'Access denied. You are not a member of this team.' };
      }
    }

    return await Sprint.getByTeamId(teamId);
  }

  static async getSprintById(sprintId, user) {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      throw { statusCode: 404, message: 'Sprint not found' };
    }

    if (!isAdmin(user)) {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(sprint.team_id)) {
        throw { statusCode: 403, message: 'Access denied. You are not a member of this project\'s team.' };
      }
    }

    return sprint;
  }

  static async startSprint(sprintId, user) {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      throw { statusCode: 404, message: 'Sprint not found' };
    }

    if (sprint.status !== 'planned') {
      throw { statusCode: 400, message: 'Only planned sprints can be started' };
    }

    const hasActive = await Sprint.hasActiveSprintByTeam(sprint.team_id);
    if (hasActive) {
      throw { statusCode: 400, message: 'Team already has an active sprint. Complete it before starting a new one.' };
    }

    const canManage = await canManageTeam(sprint.team_id, user);
    if (!canManage) {
      throw { statusCode: 403, message: 'Only admin or this team lead can start team sprints' };
    }

    await Sprint.updateStatus(sprintId, 'active');
    return await Sprint.findById(sprintId);
  }

  static async completeSprint(sprintId, user) {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      throw { statusCode: 404, message: 'Sprint not found' };
    }

    if (sprint.status !== 'active') {
      throw { statusCode: 400, message: 'Only active sprints can be completed' };
    }

    const canManage = await canManageTeam(sprint.team_id, user);
    if (!canManage) {
      throw { statusCode: 403, message: 'Only admin or this team lead can complete team sprints' };
    }

    await Sprint.updateStatus(sprintId, 'completed');
    return await Sprint.findById(sprintId);
  }
}

module.exports = SprintService;
