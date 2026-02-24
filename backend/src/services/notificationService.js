const Notification = require('../models/Notification');

class NotificationService {
  static async notifyTaskAssigned(assigneeId, task) {
    if (!assigneeId) return;
    const taskKey = task.task_key || `TASK-${task.id}`;
    const taskTitle = task.title || 'Untitled task';
    const message = `New task assigned: ${taskKey} - ${taskTitle}`;
    await Notification.createAssignment({
      user_id: assigneeId,
      task_id: task.id,
      message
    });
  }

  static async getMyUnreadNotifications(user) {
    const notifications = await Notification.getUnreadByUserId(user.id);
    return {
      count: notifications.length,
      notifications
    };
  }

  static async markRead(notificationId, user) {
    const affectedRows = await Notification.markAsRead(notificationId, user.id);
    if (affectedRows === 0) {
      throw { statusCode: 404, message: 'Notification not found' };
    }
    return { message: 'Notification marked as read' };
  }

  static async markAllRead(user) {
    const affectedRows = await Notification.markAllAsRead(user.id);
    return { message: 'All notifications marked as read', updated: affectedRows };
  }
}

module.exports = NotificationService;
