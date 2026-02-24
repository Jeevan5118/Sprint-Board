const { body, param } = require('express-validator');

const createTeamValidator = [
  body('name').notEmpty().withMessage('Team name is required'),
  body('description').optional(),
  body('team_lead_id').optional().isInt().withMessage('Team lead ID must be a number')
];

const addMemberValidator = [
  param('id').isInt().withMessage('Team ID must be a number'),
  body('user_id').isInt().withMessage('User ID is required and must be a number')
];

const removeMemberValidator = [
  param('id').isInt().withMessage('Team ID must be a number'),
  param('userId').isInt().withMessage('User ID must be a number')
];

const memberTasksValidator = [
  param('id').isInt().withMessage('Team ID must be a number'),
  param('userId').isInt().withMessage('User ID must be a number')
];

module.exports = { createTeamValidator, addMemberValidator, removeMemberValidator, memberTasksValidator };
