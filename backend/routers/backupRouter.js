const express = require('express');
const router = express.Router();
const {
    getLastBackup,
    getBackupStatus,
    createBackup,
    restoreFromBackup,
    getSettings,
    updateSettings
} = require('../controllers/backupController');

// 백업 정보 조회
router.get('/last', getLastBackup);
router.get('/status', getBackupStatus);

// 백업 생성 및 복원
router.post('/create', createBackup);
router.post('/restore', restoreFromBackup);

// 백업 설정 관리
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;