const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validateId, requireFields } = require('../middlewares/validator.middleware');
const { createUploadMiddleware, processUploadedFile } = require('../middlewares/upload.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 읽지 않은 메시지 수 조회
router.get('/unread-count', chatController.getUnreadCount);

// 채팅방 관련 라우트
router.post('/rooms',
    requireFields(['type', 'participants']),
    chatController.createChatRoom
);

router.get('/rooms', chatController.getChatRooms);

router.get('/rooms/search',
    requireFields(['query']),
    chatController.searchRooms
);

router.get('/rooms/:roomId',
    validateId('roomId'),
    chatController.getChatRoom
);

// 채팅방 설정 관련 라우트
router.get('/rooms/:roomId/settings',
    validateId('roomId'),
    chatController.getRoomDetail
);

router.put('/rooms/:roomId/settings',
    validateId('roomId'),
    requireFields(['notification', 'encryption', 'theme', 'roomName']),
    chatController.updateRoomSettings
);

router.put('/rooms/:roomId/name',
    validateId('roomId'),
    requireFields(['roomName']),
    chatController.updateRoomName
);

// 참여자 관리 라우트
router.put('/rooms/:roomId/participants',
    validateId('roomId'),
    requireFields(['participants']),
    chatController.updateParticipants
);

// 채팅방 고정/삭제 라우트
router.put('/rooms/:roomId/pin',
    validateId('roomId'),
    requireFields(['isPinned']),
    chatController.pinChatRoom
);

router.delete('/rooms/:roomId',
    validateId('roomId'),
    chatController.deleteRoom
);

// 메시지 관련 라우트
router.post('/rooms/:roomId/messages',
    validateId('roomId'),
    requireFields(['content', 'type']),
    chatController.sendMessage
);

router.post('/rooms/:roomId/messages/image',
    validateId('roomId'),
    createUploadMiddleware('chat')[0],
    processUploadedFile,
    chatController.sendImageMessage
);

router.put('/rooms/:roomId/messages/:messageId/read',
    validateId('roomId'),
    validateId('messageId'),
    chatController.markAsRead
);

router.put('/messages/:messageId/important',
    validateId('messageId'),
    chatController.toggleImportant
);

// 채팅방 참여/퇴장 라우트
router.post('/rooms/:roomId/join',
    validateId('roomId'),
    chatController.joinRoom
);

router.delete('/rooms/:roomId/leave',
    validateId('roomId'),
    chatController.leaveRoom
);

// 피드 액션 라우트
router.post('/rooms/:roomId/feeds/:feedId/:actionType',
    validateId('roomId'),
    validateId('feedId'),
    chatController.handleFeedAction
);

module.exports = router;