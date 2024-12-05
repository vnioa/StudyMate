const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireFields } = require('../middlewares/validator.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 백업 정보 조회 라우트
router.get('/last', backupController.getLastBackup);
router.get('/status', backupController.getBackupStatus);

// 백업 생성 라우트
router.post('/',
    requireFields(['type', 'compressionType', 'description']),
    backupController.createBackup
);

// 백업 복원 라우트
router.post('/restore',
    requireFields(['backupId']),
    backupController.restoreFromBackup
);

module.exports = router;