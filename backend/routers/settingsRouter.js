const express = require('express');
const router = express.Router();
const {
    getCurrentDisplayMode,
    getDisplaySettings,
    updateDisplayMode,
    updateDisplaySettings,
    getFontSettings,
    updateFontSettings,
    getSettings,
    getNotificationSettings,
    updateNotificationSettings,
    requestNotificationPermission,
    getPrivacySettings,
    updatePrivacySettings,
    openSystemSettings,
    getBackupSettings,
    updateAutoBackup,
    backupSettings,
    restoreSettings,
    updateSettings,
    logout,
    deleteAccount,
    getTimeSettings,
    updateTimeSettings
} = require('../controllers/settingsController');

// 디스플레이 설정
router.get('/display/mode', getCurrentDisplayMode);
router.get('/display', getDisplaySettings);
router.put('/display/mode', updateDisplayMode);
router.put('/display', updateDisplaySettings);

// 글꼴 설정
router.get('/font', getFontSettings);
router.put('/font', updateFontSettings);

// 일반 설정
router.get('/', getSettings);
router.put('/', updateSettings);

// 알림 설정
router.get('/notifications', getNotificationSettings);
router.put('/notifications', updateNotificationSettings);
router.post('/notifications/permission', requestNotificationPermission);

// 개인정보 설정
router.get('/privacy', getPrivacySettings);
router.put('/privacy', updatePrivacySettings);

// 시스템 설정
router.post('/system/open', openSystemSettings);

// 백업 설정
router.get('/backup', getBackupSettings);
router.put('/backup/auto', updateAutoBackup);
router.post('/backup', backupSettings);
router.post('/backup/restore', restoreSettings);

// 계정 관리
router.post('/logout', logout);
router.delete('/account', deleteAccount);

// 시간 설정
router.get('/time/:title', getTimeSettings);
router.put('/time/:title', updateTimeSettings);

module.exports = router;