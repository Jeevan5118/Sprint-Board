const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validators/authValidator');
const validationMiddleware = require('../middlewares/validationMiddleware');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Public routes
router.post('/register', registerValidator, validationMiddleware, AuthController.register);
router.post('/login', loginValidator, validationMiddleware, AuthController.login);

// Protected routes
router.get('/profile', authMiddleware, AuthController.getProfile);
router.get('/users', authMiddleware, require('../middlewares/authMiddleware').roleMiddleware('admin'), AuthController.getAllUsers);

module.exports = router;
