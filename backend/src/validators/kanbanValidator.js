const { param } = require('express-validator');

const kanbanProjectIdValidator = [
  param('projectId').isInt().withMessage('Project ID must be a number')
];

module.exports = {
  kanbanProjectIdValidator
};
