const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/settings/notification.controller');
const auth = require('../middleware/auth.middleware');

// 알림 설정 조회
router.get('/settings', auth, notificationController.getNotificationSettings);

// 푸시 알림 설정 업데이트
router.put('/settings/push', auth, notificationController.updatePushSettings);

// 이메일 알림 설정 업데이트
router.put('/settings/email', auth, notificationController.updateEmailSettings);

// 알림 우선순위 설정
router.put('/settings/priority', auth, notificationController.updatePriorityLevel);

// 알림 수신 시간대 설정
router.put('/settings/time', auth, notificationController.updateNotificationTime);

// 학습 관련 알림 설정
router.put('/settings/study-alerts', auth, notificationController.updateStudyAlerts);

// 알림 방법 설정 (푸시, 이메일, 인앱 등)
router.put('/settings/methods', auth, notificationController.updateNotificationMethods);

// 디바이스 토큰 등록/업데이트
router.post('/device-token', auth, notificationController.updateDeviceToken);

// 디바이스 토큰 삭제
router.delete('/device-token/:token', auth, notificationController.removeDeviceToken);

module.exports = router;