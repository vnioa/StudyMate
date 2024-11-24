const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user/user.controller');
const auth = require('../../middleware/auth.middleware');

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/logout', auth, userController.logoutUser);
router.delete('/account', auth, userController.deleteUser);
router.post('/find-id', userController.findUserId);
router.post('/reset-password', userController.resetPassword);

module.exports = router;