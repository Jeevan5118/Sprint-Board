const Project = require('../models/Project');
const Team = require('../models/Team');
const { isAdmin, canManageTeam } = require('../utils/permissions');

class ProjectService {
  static async createProject(projectData, user) {
    const { name, key_code, description, team_id, start_date, end_date, board_type } = projectData;

    // Validate team exists
    const team = await Team.findById(team_id);
    if (!team) {
      throw { statusCode: 404, message: 'Team not found' };
    }

    const canManage = await canManageTeam(team_id, user);
    if (!canManage) {
      throw { statusCode: 403, message: 'Only admin or the team lead of this team can create projects' };
    }

    // Check if key_code already exists
    const keyExists = await Project.isKeyCodeExists(key_code);
    if (keyExists) {
      throw { statusCode: 400, message: 'Project key code already exists' };
    }

    const projectId = await Project.create({
      name,
      key_code,
      description,
      team_id,
      created_by: user.id,
      start_date,
      end_date,
      board_type
    });

    return await Project.findById(projectId);
  }

  static async getAllProjects(user) {
    // Admin can see all projects
    if (isAdmin(user)) {
      return await Project.getAll();
    }

    // Regular users can only see projects from their teams
    const userTeams = await Project.getUserTeams(user.id);
    if (userTeams.length === 0) {
      return [];
    }

    const projects = await Project.getAll();
    return projects.filter(project => userTeams.includes(project.team_id));
  }

  static async getProjectById(projectId, user) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw { statusCode: 404, message: 'Project not found' };
    }

    // Admin can access any project
    if (isAdmin(user)) {
      return project;
    }

    // Check if user belongs to project's team
    const userTeams = await Project.getUserTeams(user.id);
    if (!userTeams.includes(project.team_id)) {
      throw { statusCode: 403, message: 'Access denied. You are not a member of this project\'s team.' };
    }

    return project;
  }

  static async deleteProject(projectId, user) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw { statusCode: 404, message: 'Project not found' };
    }

    const canManage = await canManageTeam(project.team_id, user);
    if (!canManage) {
      throw { statusCode: 403, message: 'Only admin or the team lead of this team can delete projects' };
    }

    await Project.delete(projectId);
    return { message: 'Project deleted successfully' };
  }
}

module.exports = ProjectService;
