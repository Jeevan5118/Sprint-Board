const express = require('express');
const router = express.Router();
const TimeLogController = require('../controllers/timeLogController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');
const {
  createTimeLogValidator,
  timeLogTaskIdValidator,
  timeLogIdValidator
} = require('../validators/timeLogValidator');

router.use(authMiddleware);

router.post('/tasks/:id/time-logs', createTimeLogValidator, validationMiddleware, TimeLogController.createTimeLog);
router.get('/tasks/:id/time-logs', timeLogTaskIdValidator, validationMiddleware, TimeLogController.getTaskTimeLogs);
router.delete('/time-logs/:id', timeLogIdValidator, validationMiddleware, TimeLogController.deleteTimeLog);

module.exports = router;
