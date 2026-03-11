const { param } = require('express-validator');

const kanbanTeamIdValidator = [
  param('teamId').isInt().withMessage('Team ID must be a number')
];

module.exports = {
  kanbanTeamIdValidator
};
