const Project = require('../models/Project');
const Task = require('../models/Task');

class KanbanService {
  static async getProjectKanban(projectId, user) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw { statusCode: 404, message: 'Project not found' };
    }

    if (user.role !== 'admin') {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(project.team_id)) {
        throw { statusCode: 403, message: 'Access denied.' };
      }
    }

    const projectTasks = await Task.getByProjectId(projectId);
    const kanbanTasks = projectTasks.filter((task) => task.sprint_id === null);

    return {
      project: {
        id: project.id,
        name: project.name,
        key_code: project.key_code,
        board_type: project.board_type,
        team_id: project.team_id,
        team_lead_id: project.team_lead_id
      },
      tasks: kanbanTasks
    };
  }
}

module.exports = KanbanService;
