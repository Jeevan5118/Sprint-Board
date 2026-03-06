const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { registerValidator, loginValidator, updateProfileValidator, adminCreateUserValidator } = require('../validators/authValidator');
const validationMiddleware = require('../middlewares/validationMiddleware');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');
const { loginRateLimit, registerRateLimit } = require('../middlewares/authRateLimit');

// Public routes
router.post('/login', loginRateLimit, loginValidator, validationMiddleware, AuthController.login);

// Protected routes
router.post('/register', authMiddleware, roleMiddleware('admin'), registerRateLimit, registerValidator, validationMiddleware, AuthController.register);
router.post('/users', authMiddleware, roleMiddleware('admin'), adminCreateUserValidator, validationMiddleware, AuthController.createUserByAdmin);
router.get('/profile', authMiddleware, AuthController.getProfile);
router.patch('/profile', authMiddleware, updateProfileValidator, validationMiddleware, AuthController.updateProfile);
router.get('/users', authMiddleware, roleMiddleware('admin'), AuthController.getAllUsers);

module.exports = router;
