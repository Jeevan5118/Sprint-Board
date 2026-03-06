const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analyticsController');
const { kanbanProjectIdValidator } = require('../validators/kanbanValidator');
const { authMiddleware } = require('../middlewares/authMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');

router.use(authMiddleware);

router.get('/kanban/:projectId', kanbanProjectIdValidator, validationMiddleware, AnalyticsController.getKanbanAnalytics);

module.exports = router;
