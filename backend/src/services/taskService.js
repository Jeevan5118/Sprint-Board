const Task = require('../models/Task');
const Project = require('../models/Project');
const Sprint = require('../models/Sprint');
const Team = require('../models/Team');
const User = require('../models/User');
const db = require('../config/database');
const NotificationService = require('./notificationService');
const FileStorageService = require('./fileStorageService');
const { isAdmin, canManageProject, canManageTeam } = require('../utils/permissions');

class TaskService {
  static isMissingTableError(error, tableName) {
    const message = String(error?.sqlMessage || error?.message || '').toLowerCase();
    return (
      (error?.code === 'ER_NO_SUCH_TABLE' || Number(error?.errno) === 1146) &&
      message.includes(String(tableName || '').toLowerCase())
    );
  }

  static isDeadlockError(error) {
    return error?.code === 'ER_LOCK_DEADLOCK' || Number(error?.errno) === 1213;
  }

  static async runWithDeadlockRetry(operation, contextLabel, retryLimit = 1) {
    let attempt = 0;
    while (attempt <= retryLimit) {
      try {
        return await operation();
      } catch (error) {
        if (!this.isDeadlockError(error) || attempt >= retryLimit) {
          throw error;
        }

        attempt += 1;
        console.warn('[task_service_deadlock_retry]', {
          context: contextLabel,
          attempt,
          code: error.code,
          errno: error.errno
        });
      }
    }
  }

  static getAllowedStatusTransitions() {
    return {
      todo: ['in_progress', 'in_review', 'done'],
      in_progress: ['todo', 'in_review', 'done'],
      in_review: ['todo', 'in_progress', 'done'],
      done: ['todo', 'in_progress', 'in_review']
    };
  }

  static validateStatusTransition(fromStatus, toStatus) {
    const transitions = this.getAllowedStatusTransitions();
    if (!Object.prototype.hasOwnProperty.call(transitions, fromStatus)) {
      throw { statusCode: 400, message: 'Invalid current task status' };
    }

    const isValid = transitions[fromStatus].includes(toStatus);
    if (!isValid) {
      throw { statusCode: 400, message: `Invalid status transition: ${fromStatus} -> ${toStatus}` };
    }
  }

  static async applyStatusChangeWithHistory(taskId, toStatus, userId, teamId, additionalUpdates = {}) {
    return this.runWithDeadlockRetry(async () => {
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();

        const [taskRows] = await connection.query(
          'SELECT id, status FROM tasks WHERE id = ? FOR UPDATE',
          [taskId]
        );
        const taskRow = taskRows[0];
        if (!taskRow) {
          throw { statusCode: 404, message: 'Task not found' };
        }

        const fromStatus = taskRow.status;
        const hasAdditionalUpdates = Object.keys(additionalUpdates).length > 0;

        if (fromStatus === toStatus) {
          if (hasAdditionalUpdates) {
            await Task.update(taskId, additionalUpdates, connection);
          }
          await connection.commit();
          return false;
        }

        this.validateStatusTransition(fromStatus, toStatus);

        const [limitRows] = await connection.query(
          `SELECT wip_limit
           FROM kanban_column_limits
           WHERE team_id = ? AND column_name = ?
           FOR UPDATE`,
          [teamId, toStatus]
        );
        const limitRow = limitRows[0];

        if (limitRow) {
          const [countRows] = await connection.query(
            `SELECT COUNT(*) AS total
             FROM tasks
             WHERE team_id = ? AND sprint_id IS NULL AND status = ?`,
            [teamId, toStatus]
          );
          const currentCount = Number(countRows[0]?.total || 0);
          if (currentCount >= Number(limitRow.wip_limit)) {
            console.warn('[task_service_wip_violation]', {
              teamId,
              taskId,
              toStatus,
              currentCount,
              wipLimit: Number(limitRow.wip_limit),
              userId
            });
            throw { statusCode: 400, message: `WIP limit reached for column '${toStatus}'` };
          }
        }

        try {
          await Task.insertStatusHistory(taskId, fromStatus, toStatus, userId, connection);
        } catch (historyError) {
          if (this.isMissingTableError(historyError, 'task_status_history')) {
            console.warn('[task_service_status_history_table_missing]', {
              taskId,
              fromStatus,
              toStatus,
              userId,
              teamId
            });
          } else {
            throw historyError;
          }
        }

        const updatePayload = { ...additionalUpdates, status: toStatus };
        await Task.update(taskId, updatePayload, connection);

        await connection.commit();
        return true;
      } catch (error) {
        await connection.rollback();
        console.error('[task_service_status_transaction_failed]', {
          taskId,
          toStatus,
          userId,
          teamId,
          code: error?.code,
          errno: error?.errno,
          message: error?.message
        });
        throw error;
      } finally {
        connection.release();
      }
    }, 'applyStatusChangeWithHistory');
  }

  static async ensureTeamIdAccess(teamId, user) {
    if (isAdmin(user)) return;
    const userTeams = await Project.getUserTeams(user.id);
    if (!userTeams.includes(teamId)) {
      throw { statusCode: 403, message: 'Access denied.' };
    }
  }

  static async resolveAssignedTo(assignedTo, teamId) {
    if (assignedTo === '' || assignedTo === null || assignedTo === undefined) {
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
      throw { statusCode: 400, message: 'Assigned user must be a member of the team' };
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

  static async resolveTaskScope(taskData) {
    const sprintId = taskData.sprint_id ? Number(taskData.sprint_id) : null;
    const teamIdInput = taskData.team_id ? Number(taskData.team_id) : null;
    const projectIdInput = taskData.project_id ? Number(taskData.project_id) : null;

    if (sprintId) {
      const sprint = await Sprint.findById(sprintId);
      if (!sprint) {
        throw { statusCode: 404, message: 'Sprint not found' };
      }

      let project = null;
      if (projectIdInput) {
        project = await Project.findById(projectIdInput);
        if (!project || Number(project.team_id) !== Number(sprint.team_id)) {
          throw { statusCode: 400, message: 'Project must belong to the sprint team' };
        }
      } else if (sprint.project_id) {
        project = await Project.findById(sprint.project_id);
      }

      if (!project) {
        const teamProjects = await Project.getByTeamId(sprint.team_id);
        if (!teamProjects.length) {
          throw { statusCode: 400, message: 'No project exists for this team' };
        }
        project = teamProjects[0];
      }

      return {
        teamId: Number(sprint.team_id),
        projectId: Number(project.id),
        project
      };
    }

    if (projectIdInput) {
      const project = await Project.findById(projectIdInput);
      if (!project) {
        throw { statusCode: 404, message: 'Project not found' };
      }
      if (teamIdInput && Number(project.team_id) !== teamIdInput) {
        throw { statusCode: 400, message: 'Project does not belong to selected team' };
      }
      return {
        teamId: Number(project.team_id),
        projectId: Number(project.id),
        project
      };
    }

    if (teamIdInput) {
      const team = await Team.findById(teamIdInput);
      if (!team) {
        throw { statusCode: 404, message: 'Team not found' };
      }
      const teamProjects = await Project.getByTeamId(teamIdInput);
      if (!teamProjects.length) {
        throw { statusCode: 400, message: 'Create at least one project in this team before creating stories' };
      }
      return {
        teamId: teamIdInput,
        projectId: Number(teamProjects[0].id),
        project: teamProjects[0]
      };
    }

    throw { statusCode: 400, message: 'team_id or project_id or sprint_id is required' };
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
    const { title, description, task_key, sprint_id, assigned_to, status, type, priority, story_points, estimated_hours, due_date } = taskData;
    const { teamId, projectId, project } = await this.resolveTaskScope(taskData);

    const canManage = await canManageTeam(teamId, user);
    if (!canManage) {
      throw { statusCode: 403, message: 'Only admin or this team lead can create stories' };
    }

    const allowedStatus = ['todo', 'in_progress', 'in_review', 'done'];
    const finalStatus = status ? String(status) : 'todo';
    if (!allowedStatus.includes(finalStatus)) {
      throw { statusCode: 400, message: 'Invalid status value' };
    }

    if (sprint_id) {
      const sprint = await Sprint.findById(sprint_id);
      if (!sprint || Number(sprint.team_id) !== teamId) {
        throw { statusCode: 400, message: 'Invalid sprint for this team' };
      }
      if (sprint.status === 'completed') {
        throw { statusCode: 400, message: 'Cannot create a task in a completed sprint.' };
      }
    }

    let finalTaskKey = task_key ? String(task_key).trim().toUpperCase() : '';
    if (!finalTaskKey) {
      finalTaskKey = await this.generateTaskKey(projectId, project.key_code);
    }

    const keyExists = await Task.isTaskKeyExists(finalTaskKey);
    if (keyExists) {
      throw { statusCode: 400, message: 'Task key already exists' };
    }

    const finalAssignedTo = await this.resolveAssignedTo(assigned_to, teamId);

    const taskId = await Task.create({
      title,
      description,
      task_key: finalTaskKey,
      sprint_id,
      project_id: projectId,
      team_id: teamId,
      assigned_to: finalAssignedTo,
      reporter_id: user.id,
      status: finalStatus,
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

    await this.ensureTeamIdAccess(project.team_id, user);

    return await Task.getByProjectId(projectId);
  }

  static async getTasksBySprint(sprintId, user) {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      throw { statusCode: 404, message: 'Sprint not found' };
    }

    await this.ensureTeamIdAccess(Number(sprint.team_id), user);

    return await Task.getBySprintId(sprintId);
  }

  static async getTasksByTeam(teamId, user) {
    const team = await Team.findById(teamId);
    if (!team) {
      throw { statusCode: 404, message: 'Team not found' };
    }

    await this.ensureTeamIdAccess(Number(teamId), user);

    return await Task.getByTeamId(teamId);
  }

  static async getTaskById(taskId, user) {
    const task = await Task.findById(taskId);
    if (!task) {
      throw { statusCode: 404, message: 'Task not found' };
    }

    await this.ensureTeamIdAccess(Number(task.team_id), user);

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

    await this.ensureTeamIdAccess(Number(task.team_id), user);

    const project = task.project_id ? await Project.findById(task.project_id) : null;
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
    const canManage = project ? await canManageProject(project, user) : await canManageTeam(Number(task.team_id), user);
    const allowedFields = canManage ? adminAllowedFields : memberAllowedFields;
    const sanitized = {};
    Object.entries(taskData).forEach(([key, value]) => {
      if (allowedFields.has(key)) {
        sanitized[key] = value;
      }
    });

    if (Object.prototype.hasOwnProperty.call(sanitized, 'status')) {
      const allowedStatus = ['todo', 'in_progress', 'in_review', 'done'];
      if (!allowedStatus.includes(sanitized.status)) {
        throw { statusCode: 400, message: 'Invalid status value' };
      }
    }

    if (Object.prototype.hasOwnProperty.call(sanitized, 'sprint_id')) {
      if (sanitized.sprint_id === '' || sanitized.sprint_id === null || sanitized.sprint_id === undefined) {
        sanitized.sprint_id = null;
      } else {
        const sprintId = Number(sanitized.sprint_id);
        const sprint = await Sprint.findById(sprintId);
        if (!sprint || Number(sprint.team_id) !== Number(task.team_id)) {
          throw { statusCode: 400, message: 'Invalid sprint for this task team' };
        }
        if (sprint.status === 'completed') {
          throw { statusCode: 400, message: 'Cannot move a task into a completed sprint.' };
        }
        sanitized.sprint_id = sprintId;
      }
    }

    if (Object.prototype.hasOwnProperty.call(sanitized, 'assigned_to')) {
      sanitized.assigned_to = await this.resolveAssignedTo(sanitized.assigned_to, Number(task.team_id));
    }

    if (Object.keys(sanitized).length === 0) {
      return task;
    }

    const previousAssigneeId = task.assigned_to ? Number(task.assigned_to) : null;
    if (Object.prototype.hasOwnProperty.call(sanitized, 'status')) {
      const targetStatus = sanitized.status;
      delete sanitized.status;
      const statusChanged = await this.applyStatusChangeWithHistory(taskId, targetStatus, user.id, Number(task.team_id), sanitized);
      if (statusChanged && task.assigned_to && Number(task.assigned_to) !== Number(user.id)) {
        await NotificationService.notifyTaskStatusChanged(task.assigned_to, task, targetStatus, user);
      }
    } else if (Object.keys(sanitized).length > 0) {
      await Task.update(taskId, sanitized);
    }
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

    await this.ensureTeamIdAccess(Number(task.team_id), user);

    const allowedStatus = ['todo', 'in_progress', 'in_review', 'done'];
    if (!allowedStatus.includes(status)) {
      throw { statusCode: 400, message: 'Invalid status value' };
    }

    const statusChanged = await this.applyStatusChangeWithHistory(taskId, status, user.id, Number(task.team_id));
    const updatedTask = await Task.findById(taskId);
    if (statusChanged && updatedTask.assigned_to && Number(updatedTask.assigned_to) !== Number(user.id)) {
      await NotificationService.notifyTaskStatusChanged(updatedTask.assigned_to, updatedTask, status, user);
    }
    return updatedTask;
  }

  static async deleteTask(taskId, user) {
    await this.checkSprintStatus(taskId);
    const task = await Task.findById(taskId);
    if (!task) {
      throw { statusCode: 404, message: 'Task not found' };
    }

    const canManage = await canManageTeam(Number(task.team_id), user);
    if (!canManage) {
      throw { statusCode: 403, message: 'Only admin or this team lead can delete issues' };
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

    await this.ensureTeamIdAccess(Number(task.team_id), user);

    await Task.addLink(taskId, { ...linkData, added_by: user.id });
    return await Task.getLinks(taskId);
  }

  static async addTaskAttachment(taskId, attachmentData, user) {
    await this.checkSprintStatus(taskId);
    const task = await Task.findById(taskId);
    if (!task) {
      throw { statusCode: 404, message: 'Task not found' };
    }

    await this.ensureTeamIdAccess(Number(task.team_id), user);

    await Task.addAttachment(taskId, { ...attachmentData, uploaded_by: user.id });
    return await Task.getAttachments(taskId);
  }

  static async deleteTaskAttachment(attachmentId, user) {
    const normalizedAttachmentId = Number(attachmentId);
    if (!Number.isInteger(normalizedAttachmentId) || normalizedAttachmentId <= 0) {
      throw { statusCode: 400, message: 'Attachment ID must be a valid number' };
    }

    const attachment = await Task.getAttachmentById(normalizedAttachmentId);
    if (!attachment) {
      throw { statusCode: 404, message: 'Attachment not found' };
    }

    await this.checkSprintStatus(attachment.task_id);

    const task = await Task.findById(attachment.task_id);
    if (!task) {
      throw { statusCode: 404, message: 'Task not found' };
    }

    await this.ensureTeamIdAccess(Number(task.team_id), user);

    const canManage = await canManageTeam(Number(task.team_id), user);
    const isOwner = Number(attachment.uploaded_by) === Number(user.id);
    if (!canManage && !isOwner) {
      throw { statusCode: 403, message: 'You can only delete your own attachments' };
    }

    await Task.deleteAttachmentById(normalizedAttachmentId);

    if (attachment.file_path) {
      try {
        await FileStorageService.deleteStoredFile(attachment.file_path, attachment.file_type);
      } catch (error) {
        console.warn('[task_attachment_delete_file_failed]', {
          attachmentId: normalizedAttachmentId,
          filePath: attachment.file_path,
          message: error?.message
        });
      }
    }

    return await Task.getAttachments(attachment.task_id);
  }
}

module.exports = TaskService;
