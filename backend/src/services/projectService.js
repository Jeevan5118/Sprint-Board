const Project = require('../models/Project');
const Team = require('../models/Team');

class ProjectService {
  static async createProject(projectData, userId) {
    const { name, key_code, description, team_id, start_date, end_date } = projectData;

    // Validate team exists
    const team = await Team.findById(team_id);
    if (!team) {
      throw { statusCode: 404, message: 'Team not found' };
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
      created_by: userId,
      start_date,
      end_date
    });

    return await Project.findById(projectId);
  }

  static async getAllProjects(user) {
    // Admin can see all projects
    if (user.role === 'admin') {
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
    if (user.role === 'admin') {
      return project;
    }

    // Check if user belongs to project's team
    const userTeams = await Project.getUserTeams(user.id);
    if (!userTeams.includes(project.team_id)) {
      throw { statusCode: 403, message: 'Access denied. You are not a member of this project\'s team.' };
    }

    return project;
  }

  static async deleteProject(projectId) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw { statusCode: 404, message: 'Project not found' };
    }

    await Project.delete(projectId);
    return { message: 'Project deleted successfully' };
  }
}

module.exports = ProjectService;
