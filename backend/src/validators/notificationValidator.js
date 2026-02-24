const { param } = require('express-validator');

const notificationIdValidator = [
  param('id').isInt().withMessage('Notification ID must be a number')
];

module.exports = {
  notificationIdValidator
};
