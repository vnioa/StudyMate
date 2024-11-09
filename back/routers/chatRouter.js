// routers/chatRouter.js
const express = require('express');
const router = express.Router();
const { getChatList, createChatRoom } = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/list', getChatList);
router.post('/create', createChatRoom);

module.exports = router;