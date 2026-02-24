const Task = require('../models/Task');
const Project = require('../models/Project');
const Sprint = require('../models/Sprint');
const Team = require('../models/Team');
const User = require('../models/User');
const NotificationService = require('./notificationService');

class TaskService {
  static async resolveAssignedTo(assignedTo, teamId) {
    if (
      assignedTo === '' ||
      assignedTo === null ||
      assignedTo === undefined
    ) {
      return null;
    }

    const assigneeId = Number(assignedTo);
    if (!Number.isInteger(assigneeId) || assigneeId <= 0) {
      throw { statusCode: 400, message: 'Assigned user ID must be a valid number' };
    }

    const assignee = await User.findById(assigneeId);
    if (!assignee) {
      throw { statusCode: 404, message: 'Assigned user not found' };
    }

    const isMember = await Team.isMemberExists(teamId, assigneeId);
    if (!isMember) {
      throw { statusCode: 400, message: 'Assigned user must be a member of the project team' };
    }

    return assigneeId;
  }

  static async generateTaskKey(projectId, projectKey) {
    const existingTasks = await Task.getByProjectId(projectId);
    const prefix = `${projectKey}-`;
    let maxSequence = 0;

    existingTasks.forEach((task) => {
      const key = task.task_key || '';
      if (!key.startsWith(prefix)) return;
      const suffix = key.slice(prefix.length);
      const sequence = Number.parseInt(suffix, 10);
      if (!Number.isNaN(sequence) && sequence > maxSequence) {
        maxSequence = sequence;
      }
    });

    return `${prefix}${maxSequence + 1}`;
  }

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
    if (user.role !== 'admin') {
      throw { statusCode: 403, message: 'Only admins can create issues' };
    }

    const { title, description, task_key, sprint_id, project_id, assigned_to, type, priority, story_points, estimated_hours, due_date } = taskData;
    const projectId = Number(project_id);

    // Validate project exists and user has access
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

    // Validate sprint if provided
    if (sprint_id) {
      const sprint = await Sprint.findById(sprint_id);
      if (!sprint || Number(sprint.project_id) !== projectId) {
        throw { statusCode: 400, message: 'Invalid sprint for this project' };
      }
    }

    // Auto-generate key when client does not provide one
    let finalTaskKey = task_key ? String(task_key).trim().toUpperCase() : '';
    if (!finalTaskKey) {
      finalTaskKey = await this.generateTaskKey(projectId, project.key_code);
    }

    // Check task key uniqueness
    const keyExists = await Task.isTaskKeyExists(finalTaskKey);
    if (keyExists) {
      throw { statusCode: 400, message: 'Task key already exists' };
    }

    const finalAssignedTo = await this.resolveAssignedTo(assigned_to, project.team_id);

    const taskId = await Task.create({
      title,
      description,
      task_key: finalTaskKey,
      sprint_id,
      project_id: projectId,
      assigned_to: finalAssignedTo,
      reporter_id: user.id,
      type,
      priority,
      story_points,
      estimated_hours,
      due_date
    });
    const createdTask = await Task.findById(taskId);

    if (createdTask.assigned_to && Number(createdTask.assigned_to) !== Number(user.id)) {
      await NotificationService.notifyTaskAssigned(createdTask.assigned_to, createdTask);
    }

    return createdTask;
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

    const adminAllowedFields = new Set([
      'title',
      'description',
      'sprint_id',
      'assigned_to',
      'type',
      'priority',
      'story_points',
      'estimated_hours',
      'due_date',
      'status'
    ]);
    const memberAllowedFields = new Set([
      'sprint_id',
      'story_points',
      'status'
    ]);
    const allowedFields = user.role === 'admin' ? adminAllowedFields : memberAllowedFields;
    const sanitized = {};
    Object.entries(taskData).forEach(([key, value]) => {
      if (allowedFields.has(key)) {
        sanitized[key] = value;
      }
    });

    if (sanitized.status) {
      const allowedStatus = ['todo', 'in_progress', 'in_review', 'done'];
      if (!allowedStatus.includes(sanitized.status)) {
        throw { statusCode: 400, message: 'Invalid status value' };
      }
    }

    if (Object.prototype.hasOwnProperty.call(sanitized, 'sprint_id')) {
      if (
        sanitized.sprint_id === '' ||
        sanitized.sprint_id === null ||
        sanitized.sprint_id === undefined
      ) {
        sanitized.sprint_id = null;
      } else {
        const sprintId = Number(sanitized.sprint_id);
        const sprint = await Sprint.findById(sprintId);
        if (!sprint || Number(sprint.project_id) !== Number(task.project_id)) {
          throw { statusCode: 400, message: 'Invalid sprint for this task project' };
        }
        sanitized.sprint_id = sprintId;
      }
    }

    if (Object.prototype.hasOwnProperty.call(sanitized, 'assigned_to')) {
      sanitized.assigned_to = await this.resolveAssignedTo(sanitized.assigned_to, project.team_id);
    }

    if (Object.keys(sanitized).length === 0) {
      return task;
    }

    const previousAssigneeId = task.assigned_to ? Number(task.assigned_to) : null;

    await Task.update(taskId, sanitized);
    const updatedTask = await Task.findById(taskId);

    if (Object.prototype.hasOwnProperty.call(sanitized, 'assigned_to')) {
      const newAssigneeId = updatedTask.assigned_to ? Number(updatedTask.assigned_to) : null;
      const changedAssignee = previousAssigneeId !== newAssigneeId;
      const selfAssignedByAssignee = Number(user.id) === newAssigneeId;
      if (changedAssignee && newAssigneeId && !selfAssignedByAssignee) {
        await NotificationService.notifyTaskAssigned(newAssigneeId, updatedTask);
      }
    }

    return updatedTask;
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
    if (user.role !== 'admin') {
      throw { statusCode: 403, message: 'Only admins can delete issues' };
    }

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
