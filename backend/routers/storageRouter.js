const express = require('express');
const router = express.Router();
const {
    getCurrentStorage,
    getStorageStats,
    changeStorageType,
    syncData
} = require('../controllers/storageController');

// 현재 저장소 타입 조회
router.get('/current', getCurrentStorage);

// 저장소 통계 조회
router.get('/stats', getStorageStats);

// 저장소 타입 변경
router.put('/type', changeStorageType);

// 데이터 동기화
router.post('/sync', syncData);

module.exports = router;