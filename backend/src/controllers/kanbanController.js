const KanbanService = require('../services/kanbanService');

class KanbanController {
  static async getProjectKanban(req, res, next) {
    try {
      const { projectId } = req.params;
      const kanban = await KanbanService.getProjectKanban(projectId, req.user);

      res.status(200).json({
        success: true,
        data: kanban
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = KanbanController;
