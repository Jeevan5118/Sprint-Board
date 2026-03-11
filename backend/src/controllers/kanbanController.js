const KanbanService = require('../services/kanbanService');

class KanbanController {
  static async getTeamKanban(req, res, next) {
    try {
      const { teamId } = req.params;
      const kanban = await KanbanService.getTeamKanban(teamId, req.user);

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
