const { body, param } = require('express-validator');

const createProjectValidator = [
  body('name').notEmpty().withMessage('Project name is required'),
  body('key_code').notEmpty().withMessage('Project key code is required')
    .isLength({ min: 2, max: 10 }).withMessage('Key code must be 2-10 characters'),
  body('description').optional(),
  body('team_id').isInt().withMessage('Team ID is required and must be a number'),
  body('start_date').optional().isISO8601().withMessage('Invalid start date format'),
  body('end_date').optional().isISO8601().withMessage('Invalid end date format')
];

const projectIdValidator = [
  param('id').isInt().withMessage('Project ID must be a number')
];

module.exports = { createProjectValidator, projectIdValidator };
