const AnalyticsService = require('../services/analyticsService');

class AnalyticsController {
  static async getKanbanAnalytics(req, res, next) {
    try {
      const { projectId } = req.params;
      const analytics = await AnalyticsService.getKanbanAnalytics(projectId, req.user);

      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AnalyticsController;
