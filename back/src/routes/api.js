const express = require('express');
const router = express.Router();
const userController = require('../controllers/user/user.controller');
const chatController = require('../controllers/community/chat.controller');
const friendController = require('../controllers/friend/friend.controller');
const auth = require('../middleware/auth.middleware');

// 인증 관련 라우트
router.post('/auth/check-username', userController.checkUsername);
router.post('/auth/register', userController.registerUser);
router.post('/auth/verify-email', userController.sendVerificationCode);
router.post('/auth/login', userController.loginUser);
router.post('/auth/validate-token', userController.validateToken);
router.post('/auth/find-id', userController.findUserId);
router.post('/auth/reset-password', userController.resetPassword);

// // 채팅 관련 라우트
// router.get('/chat/rooms', auth, chatController.getRooms);
// router.post('/chat/rooms', auth, chatController.createRoom);
// router.put('/chat/rooms/:roomId', auth, chatController.updateRoom);
// router.delete('/chat/rooms/:roomId', auth, chatController.leaveRoom);
// router.get('/chat/rooms/:roomId/messages', auth, chatController.getMessages);
// router.post('/chat/rooms/:roomId/messages', auth, chatController.sendMessage);
// router.delete('/chat/messages/:messageId', auth, chatController.deleteMessage);

// // 친구 관련 라우트
// router.get('/friends', auth, friendController.getFriends);
// router.post('/friends/request', auth, friendController.sendFriendRequest);
// router.put('/friends/request/:requestId', auth, friendController.respondToFriendRequest);
// router.delete('/friends/:friendId', auth, friendController.deleteFriend);
// router.get('/friends/blocked', auth, friendController.getBlockedUsers);
// router.post('/friends/block', auth, friendController.blockUser);
// router.delete('/friends/block/:userId', auth, friendController.unblockUser);

module.exports = router;