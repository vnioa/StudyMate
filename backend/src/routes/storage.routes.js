const express = require('express');
const router = express.Router();
const storageController = require('../controllers/storage.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireFields } = require('../middlewares/validator.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 현재 저장소 타입 조회
router.get('/current', storageController.getCurrentStorage);

// 저장소 통계 조회
router.get('/stats', storageController.getStorageStats);

// 저장소 타입 변경
router.put('/type',
    requireFields(['type', 'transferData']),
    storageController.changeStorageType
);

// 데이터 동기화
router.post('/sync', storageController.syncData);

module.exports = router;