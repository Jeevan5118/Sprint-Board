const Sprint = require('../models/Sprint');
const Project = require('../models/Project');

class SprintService {
  static async createSprint(sprintData, user) {
    const { name, goal, project_id, start_date, end_date } = sprintData;

    // Validate project exists and user has access
    const project = await Project.findById(project_id);
    if (!project) {
      throw { statusCode: 404, message: 'Project not found' };
    }

    // Check team access for non-admin users
    if (user.role !== 'admin') {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(project.team_id)) {
        throw { statusCode: 403, message: 'Access denied. You are not a member of this project\'s team.' };
      }
    }

    const sprintId = await Sprint.create({ name, goal, project_id, start_date, end_date });
    return await Sprint.findById(sprintId);
  }

  static async getSprintsByProject(projectId, user) {
    // Validate project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      throw { statusCode: 404, message: 'Project not found' };
    }

    // Check team access for non-admin users
    if (user.role !== 'admin') {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(project.team_id)) {
        throw { statusCode: 403, message: 'Access denied. You are not a member of this project\'s team.' };
      }
    }

    return await Sprint.getByProjectId(projectId);
  }

  static async getSprintById(sprintId, user) {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      throw { statusCode: 404, message: 'Sprint not found' };
    }

    // Validate project access
    const project = await Project.findById(sprint.project_id);
    if (user.role !== 'admin') {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(project.team_id)) {
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

    // Check if project already has an active sprint
    const hasActive = await Sprint.hasActiveSprint(sprint.project_id);
    if (hasActive) {
      throw { statusCode: 400, message: 'Project already has an active sprint. Complete it before starting a new one.' };
    }

    // Validate access
    const project = await Project.findById(sprint.project_id);
    if (user.role !== 'admin') {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(project.team_id)) {
        throw { statusCode: 403, message: 'Access denied.' };
      }
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

    // Validate access
    const project = await Project.findById(sprint.project_id);
    if (user.role !== 'admin') {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(project.team_id)) {
        throw { statusCode: 403, message: 'Access denied.' };
      }
    }

    await Sprint.updateStatus(sprintId, 'completed');
    return await Sprint.findById(sprintId);
  }
}

module.exports = SprintService;
