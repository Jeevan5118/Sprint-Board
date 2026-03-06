const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// All dashboard routes require authentication
router.use(authMiddleware);

// Get sprint dashboard
router.get('/sprint/:sprintId', DashboardController.getSprintDashboard);

// Get project dashboard
router.get('/project/:projectId', DashboardController.getProjectDashboard);

// Get user dashboard (my tasks)
router.get('/user', DashboardController.getUserDashboard);

// Get team dashboard
router.get('/team/:teamId', DashboardController.getTeamDashboard);

// Get team + project progress report for current user
router.get('/team-project-progress', DashboardController.getTeamProjectProgress);
router.get('/deadline-alerts', DashboardController.getDeadlineAlerts);

module.exports = router;
