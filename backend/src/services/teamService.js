const Team = require('../models/Team');
const User = require('../models/User');

class TeamService {
  static async createTeam(teamData) {
    const { name, description, team_lead_id } = teamData;

    // Validate team lead exists
    if (team_lead_id) {
      const teamLead = await User.findById(team_lead_id);
      if (!teamLead) {
        throw { statusCode: 404, message: 'Team lead not found' };
      }
    }

    const teamId = await Team.create({ name, description, team_lead_id });
    
    // Add team lead as member
    if (team_lead_id) {
      await Team.addMember(teamId, team_lead_id);
    }

    return await Team.findById(teamId);
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

  static async getTeamById(teamId) {
    const team = await Team.findById(teamId);
    if (!team) {
      throw { statusCode: 404, message: 'Team not found' };
    }

    const members = await Team.getTeamMembers(teamId);
    return { ...team, members };
  }

  static async getTeamMembers(teamId, requester) {
    const team = await Team.findById(teamId);
    if (!team) {
      throw { statusCode: 404, message: 'Team not found' };
    }

    if (requester.role !== 'admin') {
      const isMember = await Team.isMemberExists(teamId, requester.id);
      if (!isMember) {
        throw { statusCode: 403, message: 'Access denied. You are not a member of this team.' };
      }
    }

    return await Team.getTeamMembers(teamId);
  }

  static async addTeamMember(teamId, userId) {
    const team = await Team.findById(teamId);
    if (!team) {
      throw { statusCode: 404, message: 'Team not found' };
    }

    const user = await User.findById(userId);
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const exists = await Team.isMemberExists(teamId, userId);
    if (exists) {
      throw { statusCode: 400, message: 'User is already a team member' };
    }

    // Check team member limit (max 10 members)
    const members = await Team.getTeamMembers(teamId);
    if (members.length >= 10) {
      throw { statusCode: 400, message: 'Team already has maximum 10 members' };
    }

    await Team.addMember(teamId, userId);
    return await this.getTeamById(teamId);
  }

  static async removeTeamMember(teamId, userId) {
    const team = await Team.findById(teamId);
    if (!team) {
      throw { statusCode: 404, message: 'Team not found' };
    }

    const exists = await Team.isMemberExists(teamId, userId);
    if (!exists) {
      throw { statusCode: 400, message: 'User is not a team member' };
    }

    await Team.removeMember(teamId, userId);
    return await this.getTeamById(teamId);
  }
}

module.exports = TeamService;
