const express = require('express');
const router = express.Router();
const {
    getAchievements,
    getAchievementDetail,
    updateProgress,
    acquireAchievement
} = require('../controllers/achievementController');

// 업적 목록 조회
router.get('/', getAchievements);

// 업적 상세 조회
router.get('/:achievementId', getAchievementDetail);

// 업적 진행도 업데이트
router.put('/:achievementId/progress', updateProgress);

// 업적 획득 처리
router.post('/:achievementId/acquire', acquireAchievement);

module.exports = router;