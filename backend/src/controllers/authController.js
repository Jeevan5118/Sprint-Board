const AuthService = require('../services/authService');

class AuthController {
  static async register(req, res, next) {
    try {
      const { email, password, first_name, last_name, role, team_id } = req.body;

      const { user, token } = await AuthService.register({
        email,
        password,
        first_name,
        last_name,
        role,
        team_id
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { user, token }
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const { user, token } = await AuthService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: { user, token }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        data: { user: req.user }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllUsers(req, res, next) {
    try {
      const User = require('../models/User');
      const users = await User.getAll();
      res.status(200).json({
        success: true,
        data: { users }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
