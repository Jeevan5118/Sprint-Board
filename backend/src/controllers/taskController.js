const TaskService = require('../services/taskService');

class TaskController {
  static async createTask(req, res, next) {
    try {
      const { title, description, task_key, sprint_id, project_id, assigned_to, type, priority, story_points, estimated_hours, due_date } = req.body;

      const task = await TaskService.createTask(
        { title, description, task_key, sprint_id, project_id, assigned_to, type, priority, story_points, estimated_hours, due_date },
        req.user
      );

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: { task }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTasksByProject(req, res, next) {
    try {
      const { projectId } = req.params;
      const tasks = await TaskService.getTasksByProject(projectId, req.user);

      res.status(200).json({
        success: true,
        data: { tasks }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTasksBySprint(req, res, next) {
    try {
      const { sprintId } = req.params;
      const tasks = await TaskService.getTasksBySprint(sprintId, req.user);

      res.status(200).json({
        success: true,
        data: { tasks }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTaskById(req, res, next) {
    try {
      const { id } = req.params;
      const task = await TaskService.getTaskById(id, req.user);

      res.status(200).json({
        success: true,
        data: { task }
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTask(req, res, next) {
    try {
      const { id } = req.params;
      const task = await TaskService.updateTask(id, req.body, req.user);

      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: { task }
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTaskStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const task = await TaskService.updateTaskStatus(id, status, req.user);

      res.status(200).json({
        success: true,
        message: 'Task status updated successfully',
        data: { task }
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTask(req, res, next) {
    try {
      const { id } = req.params;
      const result = await TaskService.deleteTask(id, req.user);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  static async addTaskLink(req, res, next) {
    try {
      const { id } = req.params;
      const { url, title, description } = req.body;

      const links = await TaskService.addTaskLink(id, { url, title, description }, req.user);

      res.status(201).json({
        success: true,
        message: 'Link added successfully',
        data: { links }
      });
    } catch (error) {
      next(error);
    }
  }

  static async addTaskAttachment(req, res, next) {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const attachmentData = {
        file_name: req.file.originalname,
        file_path: req.file.path,
        file_size: req.file.size,
        file_type: req.file.mimetype
      };

      const attachments = await TaskService.addTaskAttachment(id, attachmentData, req.user);

      res.status(201).json({
        success: true,
        message: 'Attachment uploaded successfully',
        data: { attachments }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TaskController;
