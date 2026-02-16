const { body, param } = require('express-validator');

const addCommentValidator = [
  param('taskId').isInt().withMessage('Task ID must be a number'),
  body('content').notEmpty().withMessage('Comment content is required')
];

const taskIdValidator = [
  param('taskId').isInt().withMessage('Task ID must be a number')
];

const commentIdValidator = [
  param('id').isInt().withMessage('Comment ID must be a number')
];

module.exports = { addCommentValidator, taskIdValidator, commentIdValidator };
