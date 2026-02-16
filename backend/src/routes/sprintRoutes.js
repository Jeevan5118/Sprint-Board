const express = require('express');
const router = express.Router();
const SprintController = require('../controllers/sprintController');
const { createSprintValidator, sprintIdValidator, projectIdValidator } = require('../validators/sprintValidator');
const validationMiddleware = require('../middlewares/validationMiddleware');
const { authMiddleware } = require('../middlewares/authMiddleware');

// All sprint routes require authentication
router.use(authMiddleware);

// Create sprint
router.post('/', createSprintValidator, validationMiddleware, SprintController.createSprint);

// Get sprints by project
router.get('/project/:projectId', projectIdValidator, validationMiddleware, SprintController.getSprintsByProject);

// Get sprint by ID
router.get('/:id', sprintIdValidator, validationMiddleware, SprintController.getSprintById);

// Start sprint
router.patch('/:id/start', sprintIdValidator, validationMiddleware, SprintController.startSprint);

// Complete sprint
router.patch('/:id/complete', sprintIdValidator, validationMiddleware, SprintController.completeSprint);

module.exports = router;
