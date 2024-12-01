const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievement.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validateId } = require('../middlewares/validator.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 업적 목록 조회
router.get('/', achievementController.getAchievements);

// 업적 상세 조회
router.get('/:achievementId',
    validateId('achievementId'),
    achievementController.getAchievementDetail
);

// 업적 진행도 업데이트
router.put('/:achievementId/progress',
    validateId('achievementId'),
    achievementController.updateProgress
);

// 업적 획득 처리
router.post('/:achievementId/acquire',
    validateId('achievementId'),
    achievementController.acquireAchievement
);

module.exports = router;