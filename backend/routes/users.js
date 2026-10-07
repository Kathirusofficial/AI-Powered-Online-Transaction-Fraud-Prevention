const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Helper middleware: Admin-only authorization check
function adminOnly(req, res, next) {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ msg: 'Access denied: Admin role required' });
  }
}

// Format helper to ensure consistent user object structure
function formatUser(u) {
  const obj = u.toObject ? u.toObject() : u;
  return {
    id: obj._id ? obj._id.toString() : obj.id,
    name: obj.name,
    email: obj.email,
    role: obj.role || 'User',
    status: obj.status || 'Active',
    transactions: obj.transactions || 0,
    joinedDate: obj.createdAt
      ? new Date(obj.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Unknown',
    createdAt: obj.createdAt
  };
}

// GET /api/users - Read all registered users (Admin only)
router.get('/', auth, adminOnly, async (req, res) => {
  if (User.db.readyState !== 1) {
    return res.status(503).json({ msg: 'Database connection unavailable' });
  }
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    const formattedUsers = users.map(formatUser);
    res.json(formattedUsers);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ msg: 'Server error fetching users', error: err.message });
  }
});

// PATCH /api/users/:id/status - Update user status in MongoDB (Admin only)
router.patch('/:id/status', auth, adminOnly, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Active', 'Suspended', 'Pending'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ msg: `Invalid status. Allowed values: ${validStatuses.join(', ')}` });
  }

  // Prevent an admin from suspending their own account
  if (req.user.id === req.params.id && status === 'Suspended') {
    return res.status(400).json({ msg: 'An admin cannot suspend their own account' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.status = status;
    await user.save();

    res.json(formatUser(user));
  } catch (err) {
    console.error('Error updating user status:', err.message);
    res.status(500).json({ msg: 'Server error updating user status', error: err.message });
  }
});

module.exports = router;
