const TeamService = require('../services/teamService');

class TeamController {
  static async createTeam(req, res, next) {
    try {
      const { name, description, team_lead_id } = req.body;

      const team = await TeamService.createTeam({ name, description, team_lead_id });

      res.status(201).json({
        success: true,
        message: 'Team created successfully',
        data: { team }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllTeams(req, res, next) {
    try {
      const teams = await TeamService.getAllTeams();

      res.status(200).json({
        success: true,
        data: { teams }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyTeams(req, res, next) {
    try {
      const teams = await TeamService.getMyTeams(req.user.id);
      res.status(200).json({
        success: true,
        data: { teams }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeamById(req, res, next) {
    try {
      const { id } = req.params;

      const team = await TeamService.getTeamById(id);

      res.status(200).json({
        success: true,
        data: { team }
      });
    } catch (error) {
      next(error);
    }
  }

  static async addTeamMember(req, res, next) {
    try {
      const { id } = req.params;
      const { user_id } = req.body;

      const team = await TeamService.addTeamMember(id, user_id);

      res.status(200).json({
        success: true,
        message: 'Member added to team successfully',
        data: { team }
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeTeamMember(req, res, next) {
    try {
      const { id, userId } = req.params;

      const team = await TeamService.removeTeamMember(id, userId);

      res.status(200).json({
        success: true,
        message: 'Member removed from team successfully',
        data: { team }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeamMembers(req, res, next) {
    try {
      const { id } = req.params;
      const members = await TeamService.getTeamMembers(id, req.user);

      res.status(200).json({
        success: true,
        data: { members: members || [] }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeamMemberAssignedTasks(req, res, next) {
    try {
      const { id, userId } = req.params;
      const report = await TeamService.getTeamMemberAssignedTasks(Number(id), Number(userId), req.user);

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAvailableMembers(req, res, next) {
    try {
      const members = await TeamService.getAvailableMembers();
      res.status(200).json({
        success: true,
        data: { members }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TeamController;
