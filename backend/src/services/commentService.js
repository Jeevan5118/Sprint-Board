const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Project = require('../models/Project');
const NotificationService = require('./notificationService');
const { isAdmin, canManageProject } = require('../utils/permissions');

class CommentService {
  static async addComment(taskId, content, user) {
    // Validate task exists and user has access
    const task = await Task.findById(taskId);
    if (!task) {
      throw { statusCode: 404, message: 'Task not found' };
    }

    const project = await Project.findById(task.project_id);
    if (!isAdmin(user)) {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(project.team_id)) {
        throw { statusCode: 403, message: 'Access denied.' };
      }
    }

    const commentId = await Comment.create({
      task_id: taskId,
      user_id: user.id,
      content
    });

    if (task.assigned_to && Number(task.assigned_to) !== Number(user.id)) {
      await NotificationService.notifyTaskCommented(task.assigned_to, task, user);
    }

    return await Comment.findById(commentId);
  }

  static async getCommentsByTask(taskId, user) {
    // Validate task exists and user has access
    const task = await Task.findById(taskId);
    if (!task) {
      throw { statusCode: 404, message: 'Task not found' };
    }

    const project = await Project.findById(task.project_id);
    if (!isAdmin(user)) {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(project.team_id)) {
        throw { statusCode: 403, message: 'Access denied.' };
      }
    }

    return await Comment.getByTaskId(taskId);
  }

  static async deleteComment(commentId, user) {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw { statusCode: 404, message: 'Comment not found' };
    }

    if (!isAdmin(user) && comment.user_id !== user.id) {
      const task = await Task.findById(comment.task_id);
      const project = await Project.findById(task.project_id);
      const canManage = await canManageProject(project, user);
      if (!canManage) {
        throw { statusCode: 403, message: 'You can only delete your own comments' };
      }
    }

    await Comment.delete(commentId);
    return { message: 'Comment deleted successfully' };
  }
}

module.exports = CommentService;
