const User = require('../models/User');
const jwt = require('jsonwebtoken');

class UserService {
  // Register new user
  async registerUser(userData) {
    try {
      const existingUser = await User.findOne({
        $or: [{ username: userData.username }, { email: userData.email }]
      });

      if (existingUser) {
        throw new Error('Username or email already exists');
      }

      const user = new User(userData);
      await user.save();

      const token = this.generateToken(user);

      // Only include bank details for suppliers
      const userObj = {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt
      };
      if (user.role === 'SUPPLIER') {
        userObj.bankAccountName = user.bankAccountName;
        userObj.bankAccountNumber = user.bankAccountNumber;
        userObj.bankName = user.bankName;
        userObj.bankBranch = user.bankBranch;
      }
      return {
        token,
        user: userObj
      };
    } catch (error) {
      throw error;
    }
  }

  // Login user
  async loginUser(username, password) {
    try {
      const user = await User.findOne({ username }).select('+password');

      if (!user) {
        throw new Error('Invalid username or password');
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        throw new Error('Invalid username or password');
      }

      const token = this.generateToken(user);

      // Only include bank details for suppliers
      const userObj = {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt
      };
      if (user.role === 'SUPPLIER') {
        userObj.bankAccountName = user.bankAccountName;
        userObj.bankAccountNumber = user.bankAccountNumber;
        userObj.bankName = user.bankName;
        userObj.bankBranch = user.bankBranch;
      }
      return {
        token,
        user: userObj
      };
    } catch (error) {
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  // Get all users
  async getAllUsers() {
    try {
      return await User.find().sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  }

  // Update user
  async updateUser(userId, updateData) {
    try {
      let user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Update allowed fields
      if (updateData.fullName !== undefined) user.fullName = updateData.fullName;
      if (updateData.email !== undefined) user.email = updateData.email;
      if (updateData.username !== undefined) user.username = updateData.username;
      if (updateData.bankAccountName !== undefined) user.bankAccountName = updateData.bankAccountName;
      if (updateData.bankAccountNumber !== undefined) user.bankAccountNumber = updateData.bankAccountNumber;
      if (updateData.bankName !== undefined) user.bankName = updateData.bankName;
      if (updateData.bankBranch !== undefined) user.bankBranch = updateData.bankBranch;

      // Only update password if provided
      if (updateData.password) {
        user.password = updateData.password;
      }

      user.updatedAt = new Date();
      await user.save();

      // Return all user fields except password
      const userObj = user.toObject();
      delete userObj.password;
      delete userObj.__v;
      return userObj;
    } catch (error) {
      throw error;
    }
  }

  // Delete user
  async deleteUser(userId) {
    try {
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Validate token
  validateToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return { valid: true, userId: decoded.userId };
    } catch (error) {
      return { valid: false };
    }
  }

  // Get user from token
  async getUserFromToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  // User statistics for analytics dashboard
  async getUserStats() {
    try {
      const totalUsers = await User.countDocuments();

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newToday = await User.countDocuments({ createdAt: { $gte: today } });

      const byRoleResult = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);
      const byRole = byRoleResult.reduce((acc, r) => {
        acc[r._id] = r.count;
        return acc;
      }, {});

      return { totalUsers, newToday, byRole };
    } catch (error) {
      throw error;
    }
  }

  // Generate JWT token
  generateToken(user) {
    return jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }
}

module.exports = new UserService();
