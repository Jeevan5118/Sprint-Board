const DashboardService = require('../services/dashboardService');

class DashboardController {
  static async getSprintDashboard(req, res, next) {
    try {
      const { sprintId } = req.params;

      const dashboard = await DashboardService.getSprintDashboard(sprintId, req.user);

      res.status(200).json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProjectDashboard(req, res, next) {
    try {
      const { projectId } = req.params;

      const dashboard = await DashboardService.getProjectDashboard(projectId, req.user);

      res.status(200).json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserDashboard(req, res, next) {
    try {
      const dashboard = await DashboardService.getUserDashboard(req.user);

      res.status(200).json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeamDashboard(req, res, next) {
    try {
      const { teamId } = req.params;

      const dashboard = await DashboardService.getTeamDashboard(teamId, req.user);

      res.status(200).json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeamProjectProgress(req, res, next) {
    try {
      const report = await DashboardService.getTeamProjectProgress(req.user);
      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DashboardController;
