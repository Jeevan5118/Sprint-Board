const { body, param } = require('express-validator');

const allowedTaskStatuses = ['todo', 'in_progress', 'in_review', 'done'];

const createTimeLogValidator = [
  param('id').isInt().withMessage('Task ID must be a number'),
  body('hours')
    .isFloat({ gt: 0, max: 24 })
    .withMessage('Hours must be greater than 0 and less than or equal to 24'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('status')
    .optional()
    .isIn(allowedTaskStatuses)
    .withMessage('Invalid status')
];

const timeLogTaskIdValidator = [
  param('id').isInt().withMessage('Task ID must be a number')
];

const timeLogIdValidator = [
  param('id').isInt().withMessage('Time log ID must be a number')
];

module.exports = {
  createTimeLogValidator,
  timeLogTaskIdValidator,
  timeLogIdValidator
};
