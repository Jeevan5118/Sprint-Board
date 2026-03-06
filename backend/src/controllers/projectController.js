const ProjectService = require('../services/projectService');

class ProjectController {
  static async createProject(req, res, next) {
    try {
      const { name, key_code, description, team_id, start_date, end_date } = req.body;
      const boardType = req.body.board_type || 'scrum';

      if (!['scrum', 'kanban'].includes(boardType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid board_type. Allowed values: scrum, kanban'
        });
      }

      const project = await ProjectService.createProject(
        { name, key_code, description, team_id, start_date, end_date, board_type: boardType },
        req.user
      );

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: { project }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllProjects(req, res, next) {
    try {
      const projects = await ProjectService.getAllProjects(req.user);

      res.status(200).json({
        success: true,
        data: { projects }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProjectById(req, res, next) {
    try {
      const { id } = req.params;

      const project = await ProjectService.getProjectById(id, req.user);

      res.status(200).json({
        success: true,
        data: { project }
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProject(req, res, next) {
    try {
      const { id } = req.params;

      const result = await ProjectService.deleteProject(id, req.user);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProjectController;
