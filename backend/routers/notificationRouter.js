const express = require('express');
const router = express.Router();
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    registerFCMToken
} = require('../controllers/notificationController');

// 알림 목록 조회
router.get('/', getNotifications);

// 알림 읽음 처리
router.put('/:notificationId/read', markAsRead);

// 모든 알림 읽음 처리
router.put('/read-all', markAllAsRead);

// 알림 삭제
router.delete('/:notificationId', deleteNotification);

// FCM 토큰 등록
router.post('/token', registerFCMToken);

module.exports = router;