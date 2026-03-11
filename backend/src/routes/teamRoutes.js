const express = require('express');
const router = express.Router();
const TeamController = require('../controllers/teamController');
const { createTeamValidator, updateTeamValidator, addMemberValidator, removeMemberValidator, memberTasksValidator, setTeamLeadValidator, teamIdValidator } = require('../validators/teamValidator');
const validationMiddleware = require('../middlewares/validationMiddleware');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

// Public route for registration dropdown
router.get('/', TeamController.getAllTeams);

// Authenticated user route (member/admin): only teams user belongs to
router.get('/my', authMiddleware, TeamController.getMyTeams);
router.get('/:id/members', authMiddleware, TeamController.getTeamMembers);
router.get('/:id/members/:userId/tasks', authMiddleware, memberTasksValidator, validationMiddleware, TeamController.getTeamMemberAssignedTasks);

// Team creation remains admin-only
router.post('/', authMiddleware, roleMiddleware('admin'), createTeamValidator, validationMiddleware, TeamController.createTeam);
router.patch('/:id', authMiddleware, roleMiddleware('admin'), updateTeamValidator, validationMiddleware, TeamController.updateTeam);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), teamIdValidator, validationMiddleware, TeamController.deleteTeam);

// Team management (scope validated in service)
router.get('/available-members/list', authMiddleware, TeamController.getAvailableMembers);
router.get('/:id', authMiddleware, TeamController.getTeamById);
router.post('/:id/members', authMiddleware, addMemberValidator, validationMiddleware, TeamController.addTeamMember);
router.delete('/:id/members/:userId', authMiddleware, removeMemberValidator, validationMiddleware, TeamController.removeTeamMember);
router.patch('/:id/lead', authMiddleware, roleMiddleware('admin'), setTeamLeadValidator, validationMiddleware, TeamController.setTeamLead);
router.delete('/:id/lead', authMiddleware, roleMiddleware('admin'), teamIdValidator, validationMiddleware, TeamController.removeTeamLead);

module.exports = router;
