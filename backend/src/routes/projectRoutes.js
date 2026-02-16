const express = require('express');
const router = express.Router();
const ProjectController = require('../controllers/projectController');
const { createProjectValidator, projectIdValidator } = require('../validators/projectValidator');
const validationMiddleware = require('../middlewares/validationMiddleware');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

// All project routes require authentication
router.use(authMiddleware);

// Create project (Admin only)
router.post('/', roleMiddleware('admin'), createProjectValidator, validationMiddleware, ProjectController.createProject);

// Get all projects (Team-based filtering)
router.get('/', ProjectController.getAllProjects);

// Get project by ID (Team-based access)
router.get('/:id', projectIdValidator, validationMiddleware, ProjectController.getProjectById);

// Delete project (Admin only)
router.delete('/:id', roleMiddleware('admin'), projectIdValidator, validationMiddleware, ProjectController.deleteProject);

module.exports = router;
