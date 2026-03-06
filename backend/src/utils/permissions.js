const Team = require('../models/Team');

const isAdmin = (user) => user?.role === 'admin';
const isTeamLead = (user) => user?.role === 'team_lead';

const isTeamLeadOfTeam = async (teamId, userId) => {
  return Team.isTeamLead(teamId, userId);
};

const canManageTeam = async (teamId, user) => {
  if (isAdmin(user)) return true;
  return isTeamLeadOfTeam(teamId, user.id);
};

const canManageProject = async (project, user) => {
  if (isAdmin(user)) return true;
  return Number(project.team_lead_id) === Number(user.id);
};

module.exports = {
  isAdmin,
  isTeamLead,
  isTeamLeadOfTeam,
  canManageTeam,
  canManageProject
};
