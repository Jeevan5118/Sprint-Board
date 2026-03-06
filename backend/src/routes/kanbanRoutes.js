const express = require('express');
const router = express.Router();
const KanbanController = require('../controllers/kanbanController');
const { kanbanProjectIdValidator } = require('../validators/kanbanValidator');
const validationMiddleware = require('../middlewares/validationMiddleware');
const { authMiddleware } = require('../middlewares/authMiddleware');
const securityAuditMiddleware = require('../middlewares/securityAuditMiddleware');

router.use(authMiddleware);
router.use(securityAuditMiddleware);

router.get('/:projectId', kanbanProjectIdValidator, validationMiddleware, KanbanController.getProjectKanban);

module.exports = router;
