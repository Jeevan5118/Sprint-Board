const NotificationService = require('../services/notificationService');

class NotificationController {
  static async getMyUnread(req, res, next) {
    try {
      const data = await NotificationService.getMyUnreadNotifications(req.user);
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req, res, next) {
    try {
      const result = await NotificationService.markRead(req.params.id, req.user);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req, res, next) {
    try {
      const result = await NotificationService.markAllRead(req.user);
      res.status(200).json({
        success: true,
        message: result.message,
        data: { updated: result.updated }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = NotificationController;
