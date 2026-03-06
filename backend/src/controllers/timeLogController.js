const TimeLogService = require('../services/timeLogService');

class TimeLogController {
  static async createTimeLog(req, res, next) {
    try {
      const { id } = req.params;
      const { hours, description } = req.body;
      const timeLog = await TimeLogService.createTimeLog(id, { hours, description }, req.user);

      res.status(201).json({
        success: true,
        message: 'Time log created successfully',
        data: { timeLog }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTaskTimeLogs(req, res, next) {
    try {
      const { id } = req.params;
      const timeLogs = await TimeLogService.getTaskTimeLogs(id, req.user);

      res.status(200).json({
        success: true,
        data: { timeLogs }
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTimeLog(req, res, next) {
    try {
      const { id } = req.params;
      const result = await TimeLogService.deleteTimeLog(id, req.user);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TimeLogController;
