const { body, param } = require('express-validator');

const createTaskValidator = [
  body('title').notEmpty().withMessage('Task title is required'),
  body('description').optional(),
  body('task_key')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^[A-Za-z0-9_-]{2,20}$/)
    .withMessage('Task key must be 2-20 characters and contain only letters, numbers, "_" or "-"'),
  body('project_id').isInt().withMessage('Project ID is required and must be a number'),
  body('sprint_id').optional({ nullable: true, checkFalsy: true }).isInt().withMessage('Sprint ID must be a number'),
  body('assigned_to').optional({ nullable: true, checkFalsy: true }).isInt().withMessage('Assigned user ID must be a number'),
  body('type').optional().isIn(['story', 'bug', 'task', 'epic']).withMessage('Invalid task type'),
  body('priority').optional().isIn(['lowest', 'low', 'medium', 'high', 'highest']).withMessage('Invalid priority'),
  body('story_points').optional().isInt().withMessage('Story points must be a number'),
  body('estimated_hours').optional().isFloat().withMessage('Estimated hours must be a number'),
  body('due_date').optional().isISO8601().withMessage('Invalid due date format')
];

const updateTaskValidator = [
  param('id').isInt().withMessage('Task ID must be a number'),
  body('title').optional().notEmpty().withMessage('Task title cannot be empty'),
  body('sprint_id').optional({ nullable: true, checkFalsy: true }).isInt().withMessage('Sprint ID must be a number'),
  body('status').optional().isIn(['todo', 'in_progress', 'in_review', 'done']).withMessage('Invalid status'),
  body('assigned_to').optional({ nullable: true, checkFalsy: true }).isInt().withMessage('Assigned user ID must be a number'),
  body('type').optional().isIn(['story', 'bug', 'task', 'epic']).withMessage('Invalid task type'),
  body('priority').optional().isIn(['lowest', 'low', 'medium', 'high', 'highest']).withMessage('Invalid priority'),
  body('story_points').optional().isInt().withMessage('Story points must be a number'),
  body('estimated_hours').optional().isFloat().withMessage('Estimated hours must be a number'),
  body('due_date').optional().isISO8601().withMessage('Invalid due date format')
];

const updateStatusValidator = [
  param('id').isInt().withMessage('Task ID must be a number'),
  body('status').isIn(['todo', 'in_progress', 'in_review', 'done']).withMessage('Invalid status')
];

const taskIdValidator = [
  param('id').isInt().withMessage('Task ID must be a number')
];

const projectIdValidator = [
  param('projectId').isInt().withMessage('Project ID must be a number')
];

const sprintIdValidator = [
  param('sprintId').isInt().withMessage('Sprint ID must be a number')
];

const addLinkValidator = [
  param('id').isInt().withMessage('Task ID must be a number'),
  body('url').isURL().withMessage('Valid URL is required'),
  body('title').optional(),
  body('description').optional()
];

module.exports = {
  createTaskValidator,
  updateTaskValidator,
  updateStatusValidator,
  taskIdValidator,
  projectIdValidator,
  sprintIdValidator,
  addLinkValidator
};
