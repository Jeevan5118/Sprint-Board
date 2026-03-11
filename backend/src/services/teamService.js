const Team = require('../models/Team');
const User = require('../models/User');
const Task = require('../models/Task');
const { isAdmin, canManageTeam } = require('../utils/permissions');

class TeamService {
  static async createTeam(teamData) {
    const { name, description, team_lead_id } = teamData;
    let normalizedLeadId = null;

    if (team_lead_id !== undefined && team_lead_id !== null && team_lead_id !== '') {
      const teamLead = await User.findById(team_lead_id);
      if (!teamLead) {
        throw { statusCode: 404, message: 'Team lead not found' };
      }

      if (teamLead.role === 'member') {
        await User.updateRole(team_lead_id, 'team_lead');
      }

      normalizedLeadId = Number(team_lead_id);
    }

    const teamId = await Team.create({ name, description, team_lead_id: normalizedLeadId });

    if (normalizedLeadId) {
      await Team.addMember(teamId, normalizedLeadId);
    }

    return await Team.findById(teamId);
  }

  static async updateTeam(teamId, payload, requester) {
    if (!isAdmin(requester)) {
      throw { statusCode: 403, message: 'Only admin can update team details' };
    }

    const team = await Team.findById(teamId);
    if (!team) {
      throw { statusCode: 404, message: 'Team not found' };
    }

    const updates = {};
    if (Object.prototype.hasOwnProperty.call(payload, 'name')) {
      const normalizedName = String(payload.name || '').trim();
      if (!normalizedName) {
        throw { statusCode: 400, message: 'Team name is required' };
      }
      updates.name = normalizedName;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
      const normalizedDescription = String(payload.description || '').trim();
      updates.description = normalizedDescription || null;
    }

    if (Object.keys(updates).length === 0) {
      return await this.getTeamById(teamId, requester);
    }

    await Team.update(teamId, updates);
    return await this.getTeamById(teamId, requester);
  }

  static async deleteTeam(teamId, requester) {
    if (!isAdmin(requester)) {
      throw { statusCode: 403, message: 'Only admin can delete teams' };
    }

    const team = await Team.findById(teamId);
    if (!team) {
      throw { statusCode: 404, message: 'Team not found' };
    }

    await Team.delete(teamId);
    return { message: 'Team deleted successfully' };
  }

  static async getAllTeams() {
    return await Team.getAll();
  }

  static async getMyTeams(userId) {
    const teams = await Team.getTeamsByUserId(userId);
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const members = await Team.getTeamMembers(team.id);
        return { ...team, members };
      })
    );
    return teamsWithMembers;
  }

  static async getTeamMembers(teamId, requester) {
    const team = await Team.findById(teamId);
    if (!team) {
      throw { statusCode: 404, message: 'Team not found' };
    }

    if (!isAdmin(requester)) {
      const isMember = await Team.isMemberExists(teamId, requester.id);
      if (!isMember) {
        throw { statusCode: 403, message: 'Access denied. You are not a member of this team.' };
      }
    }

    return await Team.getTeamMembers(teamId);
  }

  static async getTeamMemberAssignedTasks(teamId, userId, requester) {
    const team = await Team.findById(teamId);
    if (!team) {
      throw { statusCode: 404, message: 'Team not found' };
    }

    if (!isAdmin(requester)) {
      const isRequesterMember = await Team.isMemberExists(teamId, requester.id);
      if (!isRequesterMember) {
        throw { statusCode: 403, message: 'Access denied. You are not a member of this team.' };
      }
    }

    const isTargetMember = await Team.isMemberExists(teamId, userId);
    if (!isTargetMember) {
      throw { statusCode: 404, message: 'Requested user is not a member of this team' };
    }

    const tasks = await Task.getByAssigneeAndTeam(userId, teamId);

    const statusCounts = {
      todo: 0,
      in_progress: 0,
      in_review: 0,
      done: 0
    };
    tasks.forEach((task) => {
      if (Object.prototype.hasOwnProperty.call(statusCounts, task.status)) {
        statusCounts[task.status] += 1;
      }
    });

    return {
      total: tasks.length,
      status_counts: statusCounts,
      tasks
    };
  }

  static async getAvailableMembers(requester) {
    if (!isAdmin(requester)) {
      const isLeadAnywhere = await Team.hasLedTeams(requester.id);
      if (!isLeadAnywhere) {
        throw { statusCode: 403, message: 'Access denied. Insufficient permissions.' };
      }
    }
    return await Team.getUsersNotInAnyTeam();
  }

  static async addTeamMember(teamId, userId, requester) {
    const team = await Team.findById(teamId);
    if (!team) {
      throw { statusCode: 404, message: 'Team not found' };
    }

    const canManage = await canManageTeam(teamId, requester);
    if (!canManage) {
      throw { statusCode: 403, message: 'Only admin or the team lead can manage team members' };
    }

    const user = await User.findById(userId);
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const exists = await Team.isMemberExists(teamId, userId);
    if (exists) {
      throw { statusCode: 400, message: 'User is already a team member' };
    }

    await Team.addMember(teamId, userId);
    return await this.getTeamById(teamId, requester);
  }

  static async removeTeamMember(teamId, userId, requester) {
    const team = await Team.findById(teamId);
    if (!team) {
      throw { statusCode: 404, message: 'Team not found' };
    }

    const canManage = await canManageTeam(teamId, requester);
    if (!canManage) {
      throw { statusCode: 403, message: 'Only admin or the team lead can manage team members' };
    }

    const exists = await Team.isMemberExists(teamId, userId);
    if (!exists) {
      throw { statusCode: 400, message: 'User is not a team member' };
    }

    await Team.removeMember(teamId, userId);
    return await this.getTeamById(teamId, requester);
  }

  static async setTeamLead(teamId, userId, requester) {
    if (!isAdmin(requester)) {
      throw { statusCode: 403, message: 'Only admin can assign team lead' };
    }

    const team = await Team.findById(teamId);
    if (!team) {
      throw { statusCode: 404, message: 'Team not found' };
    }

    const user = await User.findById(userId);
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const isMember = await Team.isMemberExists(teamId, userId);
    if (!isMember) {
      throw { statusCode: 400, message: 'User must be a member of the team to be assigned as team lead' };
    }

    if (user.role === 'member') {
      await User.updateRole(userId, 'team_lead');
    }

    await Team.updateTeamLead(teamId, userId);
    return await this.getTeamById(teamId, requester);
  }

  static async removeTeamLead(teamId, requester) {
    if (!isAdmin(requester)) {
      throw { statusCode: 403, message: 'Only admin can remove team lead' };
    }

    const team = await Team.findById(teamId);
    if (!team) {
      throw { statusCode: 404, message: 'Team not found' };
    }

    await Team.updateTeamLead(teamId, null);
    return await this.getTeamById(teamId, requester);
  }

  static async getTeamById(teamId, requester) {
    const team = await Team.findById(teamId);
    if (!team) {
      throw { statusCode: 404, message: 'Team not found' };
    }

    if (!requester) {
      const members = await Team.getTeamMembers(teamId);
      return { ...team, members };
    }

    if (!isAdmin(requester)) {
      const canManage = await canManageTeam(teamId, requester);
      if (!canManage) {
        throw { statusCode: 403, message: 'Access denied. Only admin or team lead can access full team details.' };
      }
    }

    const members = await Team.getTeamMembers(teamId);
    return { ...team, members };
  }
}

module.exports = TeamService;
