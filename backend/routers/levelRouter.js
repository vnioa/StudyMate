const express = require('express');
const router = express.Router();
const {
    getLevelInfo,
    getLevelStats,
    getLevelRequirements,
    gainExperience
} = require('../controllers/levelController');

// 레벨 정보 조회
router.get('/info', getLevelInfo);

// 레벨 통계 조회
router.get('/stats', getLevelStats);

// 레벨 달성 조건 조회
router.get('/requirements', getLevelRequirements);

// 경험치 획득
router.post('/experience', gainExperience);

module.exports = router;