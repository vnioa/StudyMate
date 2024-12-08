const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backup.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireFields } = require('../middlewares/validator.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 마지막 백업 정보 조회
router.get('/last', backupController.getLastBackup);

// 백업 상태 조회
router.get('/status', backupController.getBackupStatus);

// 새로운 백업 생성
router.post('/create', backupController.createBackup);

// 백업 복원
router.post('/restore', backupController.restoreFromBackup);

// 백업 설정 조회
router.get('/settings', backupController.getSettings);

// 백업 설정 업데이트
router.put('/settings',
    requireFields(['isAutoBackup', 'backupInterval']),
    backupController.updateSettings
);

module.exports = router;