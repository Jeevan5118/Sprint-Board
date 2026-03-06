const User = require('../models/User');
const Team = require('../models/Team');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { generateToken } = require('../utils/jwt');

class AuthService {
  static async register(userData) {
    const { email, password, first_name, last_name } = userData;

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
      role: 'member'
    });

    // Get user data
    const user = await User.findById(userId);

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return { user, token };
  }

  static async createUserByAdmin(userData) {
    const { email, password, first_name, last_name, team_id, role = 'member' } = userData;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedRole = ['member', 'team_lead', 'admin'].includes(role) ? role : 'member';
    const teamId = Number(team_id);

    if (!Number.isInteger(teamId) || teamId <= 0) {
      throw { statusCode: 400, message: 'Valid team_id is required' };
    }

    const team = await Team.findById(teamId);
    if (!team) {
      throw { statusCode: 404, message: 'Team not found' };
    }

    const existingUser = await User.findByEmail(normalizedEmail);
    if (existingUser) {
      throw { statusCode: 400, message: 'Email already registered' };
    }

    const hashedPassword = await hashPassword(password);
    const userId = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      first_name,
      last_name,
      role: normalizedRole
    });

    await Team.addMember(teamId, userId);
    if (normalizedRole === 'team_lead') {
      await Team.updateTeamLead(teamId, userId);
    }

    const user = await User.findById(userId);
    return { user, team_id: teamId };
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

  static async updateProfile(userId, profileData) {
    const { email, current_password, new_password } = profileData;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedNewPassword = String(new_password || '').trim();

    const userWithPassword = await User.findByEmail(normalizedEmail || '');
    let currentUser = null;
    if (userWithPassword && Number(userWithPassword.id) === Number(userId)) {
      currentUser = userWithPassword;
    } else {
      const current = await User.findById(userId);
      if (!current) {
        throw { statusCode: 404, message: 'User not found' };
      }
      const full = await User.findByEmail(current.email);
      if (!full) {
        throw { statusCode: 404, message: 'User not found' };
      }
      currentUser = full;
    }

    const hasEmailChange = normalizedEmail && normalizedEmail !== String(currentUser.email).toLowerCase();
    const hasPasswordChange = !!normalizedNewPassword;

    if (!hasEmailChange && !hasPasswordChange) {
      throw { statusCode: 400, message: 'Nothing to update' };
    }

    const isPasswordValid = await comparePassword(current_password, currentUser.password);
    if (!isPasswordValid) {
      throw { statusCode: 401, message: 'Current password is incorrect' };
    }

    if (hasEmailChange) {
      const emailTaken = await User.isEmailTakenByAnotherUser(normalizedEmail, userId);
      if (emailTaken) {
        throw { statusCode: 400, message: 'Email already in use by another account' };
      }
    }

    const updates = {};
    if (hasEmailChange) {
      updates.email = normalizedEmail;
    }
    if (hasPasswordChange) {
      if (normalizedNewPassword.length < 6) {
        throw { statusCode: 400, message: 'New password must be at least 6 characters' };
      }
      updates.password = await hashPassword(normalizedNewPassword);
    }

    await User.updateCredentials(userId, updates);
    const updatedUser = await User.findById(userId);
    const token = generateToken({ id: updatedUser.id, email: updatedUser.email, role: updatedUser.role });

    return { user: updatedUser, token };
  }
}

module.exports = AuthService;
