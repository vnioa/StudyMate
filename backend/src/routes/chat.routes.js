const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validateId, requireFields } = require('../middlewares/validator.middleware');
const upload = require('../middlewares/upload.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 읽지 않은 메시지 수 조회
router.get('/unread-count', chatController.getUnreadCount);

// 채팅방 생성
router.post('/rooms',
    requireFields(['type', 'participants']),
    chatController.createChatRoom
);

// 채팅방 목록 조회
router.get('/rooms', chatController.getChatRooms);

// 채팅방 검색
router.get('/rooms/search',
    requireFields(['query']),
    chatController.searchRooms
);

// 채팅방 상세 조회
router.get('/rooms/:roomId',
    validateId('roomId'),
    chatController.getChatRoom
);

// 채팅방 정보 조회
router.get('/rooms/:roomId/settings',
    validateId('roomId'),
    chatController.getRoomDetail
);

// 채팅방 설정 업데이트
router.put('/rooms/:roomId/settings',
    validateId('roomId'),
    requireFields(['notification', 'encryption', 'theme', 'roomName']),
    chatController.updateRoomSettings
);

// 채팅방 이름 변경
router.put('/rooms/:roomId/name',
    validateId('roomId'),
    requireFields(['roomName']),
    chatController.updateRoomName
);

// 채팅방 참여자 관리
router.put('/rooms/:roomId/participants',
    validateId('roomId'),
    requireFields(['participants']),
    chatController.updateParticipants
);

// 채팅방 고정/고정해제
router.put('/rooms/:roomId/pin',
    validateId('roomId'),
    requireFields(['isPinned']),
    chatController.pinChatRoom
);

// 채팅방 삭제
router.delete('/rooms/:roomId',
    validateId('roomId'),
    chatController.deleteRoom
);

// 메시지 전송
router.post('/rooms/:roomId/messages',
    validateId('roomId'),
    requireFields(['content', 'type']),
    chatController.sendMessage
);

// 이미지 메시지 전송
router.post('/rooms/:roomId/messages/image',
    validateId('roomId'),
    upload.single('image'),
    chatController.sendImageMessage
);

// 메시지 읽음 처리
router.put('/rooms/:roomId/messages/:messageId/read',
    validateId('roomId'),
    validateId('messageId'),
    chatController.markAsRead
);

// 메시지 중요 표시 토글
router.put('/messages/:messageId/important',
    validateId('messageId'),
    chatController.toggleImportant
);

// 채팅방 나가기
router.delete('/rooms/:roomId/leave',
    validateId('roomId'),
    chatController.leaveRoom
);

module.exports = router;