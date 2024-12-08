const express = require('express');
const router = express.Router();
const {
    getUnreadCount,
    createChatRoom,
    getChatRooms,
    getChatRoom,
    sendMessage,
    markAsRead,
    leaveRoom,
    searchRooms,
    pinChatRoom,
    deleteRoom,
    getRoomInfo,
    sendImageMessage,
    updateRoomSettings,
    updateRoomName,
    updateParticipants,
    toggleImportant,
    getRoomDetail
} = require('../controllers/chatController');

// 읽지 않은 메시지
router.get('/unread-count', getUnreadCount);

// 채팅방 CRUD
router.post('/rooms', createChatRoom);
router.get('/rooms', getChatRooms);
router.get('/rooms/search', searchRooms);
router.get('/rooms/:roomId', getChatRoom);
router.delete('/rooms/:roomId', deleteRoom);

// 채팅방 정보
router.get('/rooms/:roomId/info', getRoomInfo);
router.get('/rooms/:roomId/settings', getRoomDetail);
router.put('/rooms/:roomId/settings', updateRoomSettings);
router.put('/rooms/:roomId/name', updateRoomName);
router.put('/rooms/:roomId/pin', pinChatRoom);
router.put('/rooms/:roomId/participants', updateParticipants);

// 메시지 관리
router.post('/rooms/:roomId/messages', sendMessage);
router.post('/rooms/:roomId/messages/image', sendImageMessage);
router.put('/rooms/:roomId/messages/:messageId/read', markAsRead);
router.put('/messages/:messageId/important', toggleImportant);

// 채팅방 참여/퇴장
router.delete('/rooms/:roomId/leave', leaveRoom);

module.exports = router;