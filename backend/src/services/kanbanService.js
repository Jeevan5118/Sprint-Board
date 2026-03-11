const Team = require('../models/Team');
const Project = require('../models/Project');
const Task = require('../models/Task');

class KanbanService {
  static async getTeamKanban(teamId, user) {
    const team = await Team.findById(teamId);
    if (!team) {
      throw { statusCode: 404, message: 'Team not found' };
    }

    if (user.role !== 'admin') {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(team.id)) {
        throw { statusCode: 403, message: 'Access denied.' };
      }
    }

    const teamProjects = await Project.getByTeamId(teamId);
    const hasKanbanProject = teamProjects.some((project) => project.board_type === 'kanban');
    if (!hasKanbanProject) {
      throw { statusCode: 400, message: 'No kanban-enabled project found for this team.' };
    }

    const allTeamTasks = await Task.getByTeamId(teamId);
    const kanbanTasks = allTeamTasks.filter((task) => task.sprint_id === null);

    return {
      team: {
        id: team.id,
        name: team.name,
        team_lead_id: team.team_lead_id
      },
      tasks: kanbanTasks
    };
  }
}

module.exports = KanbanService;
