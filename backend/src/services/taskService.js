const Task = require('../models/Task');
const Project = require('../models/Project');
const Sprint = require('../models/Sprint');

class TaskService {
  static async checkSprintStatus(taskId) {
    const task = await Task.findById(taskId);
    if (task && task.sprint_id) {
      const sprint = await Sprint.findById(task.sprint_id);
      if (sprint && sprint.status === 'completed') {
        throw { statusCode: 400, message: 'Cannot modify a task in a completed sprint.' };
      }
    }
  }
  static async createTask(taskData, user) {
    const { title, description, task_key, sprint_id, project_id, assigned_to, type, priority, story_points, estimated_hours, due_date } = taskData;

    // Validate project exists and user has access
    const project = await Project.findById(project_id);
    if (!project) {
      throw { statusCode: 404, message: 'Project not found' };
    }

    if (user.role !== 'admin') {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(project.team_id)) {
        throw { statusCode: 403, message: 'Access denied.' };
      }
    }

    // Validate sprint if provided
    if (sprint_id) {
      const sprint = await Sprint.findById(sprint_id);
      if (!sprint || sprint.project_id !== project_id) {
        throw { statusCode: 400, message: 'Invalid sprint for this project' };
      }
    }

    // Check task key uniqueness
    const keyExists = await Task.isTaskKeyExists(task_key);
    if (keyExists) {
      throw { statusCode: 400, message: 'Task key already exists' };
    }

    const taskId = await Task.create({
      title,
      description,
      task_key,
      sprint_id,
      project_id,
      assigned_to,
      reporter_id: user.id,
      type,
      priority,
      story_points,
      estimated_hours,
      due_date
    });

    return await Task.findById(taskId);
  }

  static async getTasksByProject(projectId, user) {
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

    return await Task.getByProjectId(projectId);
  }

  static async getTasksBySprint(sprintId, user) {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      throw { statusCode: 404, message: 'Sprint not found' };
    }

    const project = await Project.findById(sprint.project_id);
    if (user.role !== 'admin') {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(project.team_id)) {
        throw { statusCode: 403, message: 'Access denied.' };
      }
    }

    return await Task.getBySprintId(sprintId);
  }

  static async getTaskById(taskId, user) {
    const task = await Task.findById(taskId);
    if (!task) {
      throw { statusCode: 404, message: 'Task not found' };
    }

    const project = await Project.findById(task.project_id);
    if (user.role !== 'admin') {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(project.team_id)) {
        throw { statusCode: 403, message: 'Access denied.' };
      }
    }

    const links = await Task.getLinks(taskId);
    const attachments = await Task.getAttachments(taskId);

    return { ...task, links, attachments };
  }

  static async updateTask(taskId, taskData, user) {
    await this.checkSprintStatus(taskId);
    const task = await Task.findById(taskId);
    if (!task) {
      throw { statusCode: 404, message: 'Task not found' };
    }

    const project = await Project.findById(task.project_id);
    if (user.role !== 'admin') {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(project.team_id)) {
        throw { statusCode: 403, message: 'Access denied.' };
      }
    }

    await Task.update(taskId, taskData);
    return await Task.findById(taskId);
  }

  static async updateTaskStatus(taskId, status, user) {
    await this.checkSprintStatus(taskId);
    const task = await Task.findById(taskId);
    if (!task) {
      throw { statusCode: 404, message: 'Task not found' };
    }

    const project = await Project.findById(task.project_id);
    if (user.role !== 'admin') {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(project.team_id)) {
        throw { statusCode: 403, message: 'Access denied.' };
      }
    }

    await Task.updateStatus(taskId, status);
    return await Task.findById(taskId);
  }

  static async deleteTask(taskId, user) {
    await this.checkSprintStatus(taskId);
    const task = await Task.findById(taskId);
    if (!task) {
      throw { statusCode: 404, message: 'Task not found' };
    }

    const project = await Project.findById(task.project_id);
    if (user.role !== 'admin') {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(project.team_id)) {
        throw { statusCode: 403, message: 'Access denied.' };
      }
    }

    await Task.delete(taskId);
    return { message: 'Task deleted successfully' };
  }

  static async addTaskLink(taskId, linkData, user) {
    await this.checkSprintStatus(taskId);
    const task = await Task.findById(taskId);
    if (!task) {
      throw { statusCode: 404, message: 'Task not found' };
    }

    const project = await Project.findById(task.project_id);
    if (user.role !== 'admin') {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(project.team_id)) {
        throw { statusCode: 403, message: 'Access denied.' };
      }
    }

    await Task.addLink(taskId, { ...linkData, added_by: user.id });
    return await Task.getLinks(taskId);
  }

  static async addTaskAttachment(taskId, attachmentData, user) {
    await this.checkSprintStatus(taskId);
    const task = await Task.findById(taskId);
    if (!task) {
      throw { statusCode: 404, message: 'Task not found' };
    }

    const project = await Project.findById(task.project_id);
    if (user.role !== 'admin') {
      const userTeams = await Project.getUserTeams(user.id);
      if (!userTeams.includes(project.team_id)) {
        throw { statusCode: 403, message: 'Access denied.' };
      }
    }

    await Task.addAttachment(taskId, { ...attachmentData, uploaded_by: user.id });
    return await Task.getAttachments(taskId);
  }
}

module.exports = TaskService;
