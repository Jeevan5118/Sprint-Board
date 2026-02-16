const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/commentController');
const { addCommentValidator, taskIdValidator, commentIdValidator } = require('../validators/commentValidator');
const validationMiddleware = require('../middlewares/validationMiddleware');
const { authMiddleware } = require('../middlewares/authMiddleware');

// All comment routes require authentication
router.use(authMiddleware);

// Add comment to task
router.post('/task/:taskId', addCommentValidator, validationMiddleware, CommentController.addComment);

// Get comments for a task
router.get('/task/:taskId', taskIdValidator, validationMiddleware, CommentController.getCommentsByTask);

// Delete comment
router.delete('/:id', commentIdValidator, validationMiddleware, CommentController.deleteComment);

module.exports = router;
