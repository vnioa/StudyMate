const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireFields } = require('../middlewares/validator.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 디스플레이 관련 라우트
router.get('/display/mode', settingsController.getCurrentDisplayMode);
router.get('/display', settingsController.getDisplaySettings);
router.put('/display/mode',
    requireFields(['mode', 'autoMode', 'schedule']),
    settingsController.updateDisplayMode
);

// 폰트 관련 라우트
router.get('/font', settingsController.getFontSettings);
router.put('/font',
    requireFields(['fontSize', 'applyGlobally']),
    settingsController.updateFontSettings
);
router.post('/font/reset', settingsController.resetFontSettings);
router.put('/font/preview',
    requireFields(['previewText']),
    settingsController.updatePreviewText
);

// 일반 설정 라우트
router.get('/', settingsController.getSettings);
router.put('/',
    requireFields(['key', 'value']),
    settingsController.updateSettings
);

// 알림 설정 라우트
router.get('/notifications', settingsController.getNotificationSettings);
router.put('/notifications',
    requireFields(['pushEnabled', 'emailEnabled', 'soundEnabled']),
    settingsController.updateNotificationSettings
);
router.post('/notifications/permission', settingsController.requestNotificationPermission);

// 테마 설정 라우트
router.get('/theme', settingsController.getThemeSettings);
router.put('/theme',
    requireFields(['theme']),
    settingsController.updateThemeSettings
);

// 앱 버전 라우트
router.get('/version', settingsController.getAppVersion);

// 개인정보 설정 라우트
router.get('/privacy', settingsController.getPrivacySettings);
router.put('/privacy',
    requireFields(['isPublic', 'allowMessages', 'showActivity', 'showProgress']),
    settingsController.updatePrivacySettings
);

// 시스템 설정 라우트
router.post('/system/open', settingsController.openSystemSettings);

// 백업 관련 라우트
router.get('/backup', settingsController.getBackupSettings);
router.put('/backup/auto',
    requireFields(['enabled', 'interval']),
    settingsController.updateAutoBackup
);
router.post('/backup', settingsController.backupSettings);
router.post('/backup/restore', settingsController.restoreSettings);

// 시간 설정 라우트
router.get('/time/:title', settingsController.getTimeSettings);
router.put('/time/:title',
    requireFields(['startTime', 'endTime', 'enabled', 'days']),
    settingsController.updateTimeSettings
);

module.exports = router;