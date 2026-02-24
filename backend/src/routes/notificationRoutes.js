const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { notificationIdValidator } = require('../validators/notificationValidator');
const validationMiddleware = require('../middlewares/validationMiddleware');

router.use(authMiddleware);

router.get('/my/unread', NotificationController.getMyUnread);
router.patch('/:id/read', notificationIdValidator, validationMiddleware, NotificationController.markAsRead);
router.patch('/my/read-all', NotificationController.markAllAsRead);

module.exports = router;
