
const express = require('express');
const { registerUser, loginUser, updateUserProfile, getProfile, updatePassword } = require('../controllers/authController');
const { protect, memberOnly } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/password', protect, memberOnly, updatePassword);

module.exports = router;
