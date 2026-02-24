const express = require('express');
const router = express.Router();
const TeamController = require('../controllers/teamController');
const { createTeamValidator, addMemberValidator, removeMemberValidator, memberTasksValidator } = require('../validators/teamValidator');
const validationMiddleware = require('../middlewares/validationMiddleware');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

// Public route for registration dropdown
router.get('/', TeamController.getAllTeams);

// Authenticated user route (member/admin): only teams user belongs to
router.get('/my', authMiddleware, TeamController.getMyTeams);
router.get('/:id/members', authMiddleware, TeamController.getTeamMembers);
router.get('/:id/members/:userId/tasks', authMiddleware, memberTasksValidator, validationMiddleware, TeamController.getTeamMemberAssignedTasks);

// Protected routes (Admin only)
router.use(authMiddleware, roleMiddleware('admin'));

// Team CRUD (Except getAllTeams)
router.post('/', createTeamValidator, validationMiddleware, TeamController.createTeam);
router.get('/available-members/list', TeamController.getAvailableMembers);
router.get('/:id', TeamController.getTeamById);
// Team members management
router.post('/:id/members', addMemberValidator, validationMiddleware, TeamController.addTeamMember);
router.delete('/:id/members/:userId', removeMemberValidator, validationMiddleware, TeamController.removeTeamMember);

module.exports = router;
