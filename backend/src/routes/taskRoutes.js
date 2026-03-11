const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const {
  createTaskValidator,
  updateTaskValidator,
  updateStatusValidator,
  taskIdValidator,
  attachmentIdValidator,
  projectIdValidator,
  sprintIdValidator,
  teamIdValidator,
  addLinkValidator
} = require('../validators/taskValidator');
const validationMiddleware = require('../middlewares/validationMiddleware');
const { authMiddleware } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// All task routes require authentication
router.use(authMiddleware);

// Create task
router.post('/', createTaskValidator, validationMiddleware, TaskController.createTask);

// Get tasks by project
router.get('/project/:projectId', projectIdValidator, validationMiddleware, TaskController.getTasksByProject);

// Get tasks by sprint
router.get('/sprint/:sprintId', sprintIdValidator, validationMiddleware, TaskController.getTasksBySprint);

// Get tasks by team
router.get('/team/:teamId', teamIdValidator, validationMiddleware, TaskController.getTasksByTeam);

// Get task by ID
router.get('/:id', taskIdValidator, validationMiddleware, TaskController.getTaskById);

// Update task
router.put('/:id', updateTaskValidator, validationMiddleware, TaskController.updateTask);

// Update task status (for drag and drop)
router.patch('/:id/status', updateStatusValidator, validationMiddleware, TaskController.updateTaskStatus);

// Delete task
router.delete('/:id', taskIdValidator, validationMiddleware, TaskController.deleteTask);

// Add link to task
router.post('/:id/links', addLinkValidator, validationMiddleware, TaskController.addTaskLink);

// Add attachment to task
router.post('/:id/attachments', taskIdValidator, validationMiddleware, upload.single('file'), TaskController.addTaskAttachment);
router.delete('/attachments/:attachmentId', attachmentIdValidator, validationMiddleware, TaskController.deleteTaskAttachment);

module.exports = router;
