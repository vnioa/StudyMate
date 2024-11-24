const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const messageController = require('../controllers/message.controller');
const roomController = require('../controllers/room.controller');
const fileController = require('../controllers/file.controller');
const auth = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// 채팅방 관리
router.post('/rooms',
    auth,
    roomController.createRoom
);

router.get('/rooms',
    auth,
    roomController.getRooms
);

router.put('/rooms/:roomId',
    auth,
    roomController.updateRoom
);

router.delete('/rooms/:roomId',
    auth,
    roomController.leaveRoom
);

// 메시지 관리
router.post('/messages',
    auth,
    messageController.sendMessage
);

router.get('/rooms/:roomId/messages',
    auth,
    messageController.getMessages
);

router.delete('/messages/:messageId',
    auth,
    messageController.deleteMessage
);

router.put('/rooms/:roomId/read',
    auth,
    messageController.markAsRead
);

// 파일 관리
router.post('/files/:roomId',
    auth,
    upload.single('file'),
    fileController.uploadFile
);

router.get('/files/:roomId',
    auth,
    fileController.getFiles
);

router.get('/files/:fileId/download',
    auth,
    fileController.downloadFile
);

router.delete('/files/:fileId',
    auth,
    fileController.deleteFile
);

// 채팅방 참여자 관리
router.post('/rooms/:roomId/participants',
    auth,
    chatController.manageParticipants
);

module.exports = router;