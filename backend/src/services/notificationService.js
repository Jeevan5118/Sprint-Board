const Notification = require('../models/Notification');

class NotificationService {
  static formatActor(user) {
    const first = user?.first_name || '';
    const last = user?.last_name || '';
    const fullName = `${first} ${last}`.trim();
    return fullName || 'Someone';
  }

  static async notifyTaskAssigned(assigneeId, task) {
    if (!assigneeId) return;
    const taskKey = task.task_key || `TASK-${task.id}`;
    const taskTitle = task.title || 'Untitled task';
    const message = `New task assigned: ${taskKey} - ${taskTitle}`;
    await Notification.create({
      user_id: assigneeId,
      task_id: task.id,
      type: 'task_assigned',
      message
    });
  }

  static async notifyTaskStatusChanged(recipientId, task, toStatus, actorUser) {
    if (!recipientId) return;
    const taskKey = task.task_key || `TASK-${task.id}`;
    const actor = this.formatActor(actorUser);
    const message = `${actor} moved ${taskKey} to ${String(toStatus || '').replace('_', ' ')}`;
    await Notification.create({
      user_id: recipientId,
      task_id: task.id,
      type: 'task_status_changed',
      message
    });
  }

  static async notifyTaskCommented(recipientId, task, actorUser) {
    if (!recipientId) return;
    const taskKey = task.task_key || `TASK-${task.id}`;
    const actor = this.formatActor(actorUser);
    const message = `${actor} commented on ${taskKey}`;
    await Notification.create({
      user_id: recipientId,
      task_id: task.id,
      type: 'task_commented',
      message
    });
  }

  static async notifyTaskTimeLogged(recipientId, task, hours, actorUser) {
    if (!recipientId) return;
    const taskKey = task.task_key || `TASK-${task.id}`;
    const actor = this.formatActor(actorUser);
    const message = `${actor} logged ${Number(hours).toFixed(2)}h on ${taskKey}`;
    await Notification.create({
      user_id: recipientId,
      task_id: task.id,
      type: 'task_time_logged',
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
