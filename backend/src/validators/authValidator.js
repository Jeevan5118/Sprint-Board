const { body } = require('express-validator');

const registerValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('role').optional().equals('member').withMessage('Role is fixed to member for self-registration')
];

const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const updateProfileValidator = [
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
];

const adminCreateUserValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Member name is required'),
  body('team_id').isInt().withMessage('Team ID is required and must be a number'),
  body('role').optional().isIn(['admin', 'team_lead', 'member']).withMessage('Invalid role')
];

module.exports = {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  adminCreateUserValidator
};
