const User = require('../models/User');
const Team = require('../models/Team');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { generateToken } = require('../utils/jwt');

class AuthService {
  static async register(userData) {
    const { email, password, first_name, last_name, role, team_id } = userData;

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw { statusCode: 400, message: 'Email already registered' };
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userId = await User.create({
      email,
      password: hashedPassword,
      first_name,
      last_name,
      role: role || 'member'
    });

    // Get user data
    const user = await User.findById(userId);

    // Add to team if provided
    if (team_id) {
      await Team.addMember(team_id, userId);
    }

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return { user, token };
  }

  static async login(email, password) {
    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      throw { statusCode: 401, message: 'Invalid credentials' };
    }

    // Check if active
    if (!user.is_active) {
      throw { statusCode: 403, message: 'Account is inactive' };
    }

    // Verify password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw { statusCode: 401, message: 'Invalid credentials' };
    }

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    // Remove password from response
    delete user.password;

    return { user, token };
  }
}

module.exports = AuthService;
