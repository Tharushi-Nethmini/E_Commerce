const userService = require('../services/userService');

class UserController {
  // Register user
  async register(req, res) {
    try {
      const result = await userService.registerUser(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { username, password } = req.body;
      const result = await userService.loginUser(username, password);
      res.status(200).json(result);
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }

  // Get user by ID
  async getUserById(req, res) {
    try {
      const user = await userService.getUserById(req.params.id);
      res.status(200).json(user);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  // Get all users
  async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Update user
  async updateUser(req, res) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      res.status(200).json(user);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Partially update user
  async partialUpdateUser(req, res) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      res.status(200).json(user);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Delete user
  async deleteUser(req, res) {
    try {
      const result = await userService.deleteUser(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  // Validate token
  async validateToken(req, res) {
    try {
      const { token } = req.body;
      const result = userService.validateToken(token);
      res.status(200).json({ valid: result.valid });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Get user from token
  async getUserFromToken(req, res) {
    try {
      const { token } = req.body;
      const user = await userService.getUserFromToken(token);
      res.status(200).json(user);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // User statistics
  async getUserStats(req, res) {
    try {
      const stats = await userService.getUserStats();
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new UserController();
