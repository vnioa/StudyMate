const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validateId, requireFields } = require('../middlewares/validator.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 알림 목록 조회
router.get('/', notificationController.getNotifications);

// 단일 알림 읽음 처리
router.put('/:notificationId/read',
    validateId('notificationId'),
    notificationController.markAsRead
);

// 모든 알림 읽음 처리
router.put('/read-all', notificationController.markAllAsRead);

// 알림 삭제
router.delete('/:notificationId',
    validateId('notificationId'),
    notificationController.deleteNotification
);

// FCM 토큰 등록
router.post('/token',
    requireFields(['token']),
    notificationController.registerFCMToken
);

module.exports = router;