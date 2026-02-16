const { body, param } = require('express-validator');

const createSprintValidator = [
  body('name').notEmpty().withMessage('Sprint name is required'),
  body('goal').optional(),
  body('project_id').isInt().withMessage('Project ID is required and must be a number'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required')
];

const sprintIdValidator = [
  param('id').isInt().withMessage('Sprint ID must be a number')
];

const projectIdValidator = [
  param('projectId').isInt().withMessage('Project ID must be a number')
];

module.exports = { createSprintValidator, sprintIdValidator, projectIdValidator };
