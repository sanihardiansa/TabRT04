const express = require('express');
const router = express.Router();
const { login, getProfile, changePassword } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Public route for login
router.post('/login', login);

// Secured routes
router.get('/profile', verifyToken, getProfile);
router.put('/change-password', verifyToken, changePassword);

module.exports = router;
