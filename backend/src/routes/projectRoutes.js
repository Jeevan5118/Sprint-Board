const express = require('express');
const router = express.Router();
const ProjectController = require('../controllers/projectController');
const { createProjectValidator, projectIdValidator } = require('../validators/projectValidator');
const validationMiddleware = require('../middlewares/validationMiddleware');
const { authMiddleware } = require('../middlewares/authMiddleware');

// All project routes require authentication
router.use(authMiddleware);

// Create project (Admin or Team Lead of that team; scope validated in service)
router.post('/', createProjectValidator, validationMiddleware, ProjectController.createProject);

// Get all projects (Team-based filtering)
router.get('/', ProjectController.getAllProjects);

// Get project by ID (Team-based access)
router.get('/:id', projectIdValidator, validationMiddleware, ProjectController.getProjectById);

// Delete project (Admin or Team Lead of that team; scope validated in service)
router.delete('/:id', projectIdValidator, validationMiddleware, ProjectController.deleteProject);

module.exports = router;
