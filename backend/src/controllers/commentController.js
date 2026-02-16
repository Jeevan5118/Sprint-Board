const CommentService = require('../services/commentService');

class CommentController {
  static async addComment(req, res, next) {
    try {
      const { taskId } = req.params;
      const { content } = req.body;

      const comment = await CommentService.addComment(taskId, content, req.user);

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: { comment }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCommentsByTask(req, res, next) {
    try {
      const { taskId } = req.params;

      const comments = await CommentService.getCommentsByTask(taskId, req.user);

      res.status(200).json({
        success: true,
        data: { comments }
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteComment(req, res, next) {
    try {
      const { id } = req.params;

      const result = await CommentService.deleteComment(id, req.user);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CommentController;
