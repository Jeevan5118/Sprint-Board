const SprintService = require('../services/sprintService');

class SprintController {
  static async createSprint(req, res, next) {
    try {
      const { name, goal, team_id, project_id, start_date, end_date } = req.body;

      const sprint = await SprintService.createSprint(
        { name, goal, team_id, project_id, start_date, end_date },
        req.user
      );

      res.status(201).json({
        success: true,
        message: 'Sprint created successfully',
        data: { sprint }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSprintsByProject(req, res, next) {
    try {
      const { projectId } = req.params;

      const sprints = await SprintService.getSprintsByProject(projectId, req.user);

      res.status(200).json({
        success: true,
        data: { sprints }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSprintsByTeam(req, res, next) {
    try {
      const { teamId } = req.params;

      const sprints = await SprintService.getSprintsByTeam(teamId, req.user);

      res.status(200).json({
        success: true,
        data: { sprints }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSprintById(req, res, next) {
    try {
      const { id } = req.params;

      const sprint = await SprintService.getSprintById(id, req.user);

      res.status(200).json({
        success: true,
        data: { sprint }
      });
    } catch (error) {
      next(error);
    }
  }

  static async startSprint(req, res, next) {
    try {
      const { id } = req.params;

      const sprint = await SprintService.startSprint(id, req.user);

      res.status(200).json({
        success: true,
        message: 'Sprint started successfully',
        data: { sprint }
      });
    } catch (error) {
      next(error);
    }
  }

  static async completeSprint(req, res, next) {
    try {
      const { id } = req.params;

      const sprint = await SprintService.completeSprint(id, req.user);

      res.status(200).json({
        success: true,
        message: 'Sprint completed successfully',
        data: { sprint }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SprintController;
