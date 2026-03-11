const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analyticsController');
const { kanbanTeamIdValidator } = require('../validators/kanbanValidator');
const { authMiddleware } = require('../middlewares/authMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');

router.use(authMiddleware);

router.get('/kanban/team/:teamId', kanbanTeamIdValidator, validationMiddleware, AnalyticsController.getKanbanAnalytics);

module.exports = router;
