const express = require('express');
const router = express.Router();
const levelController = require('../controllers/levelController');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireFields } = require('../middlewares/validator.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 레벨 정보 조회
router.get('/info', levelController.getLevelInfo);

// 레벨 통계 조회
router.get('/stats', levelController.getLevelStats);

// 레벨 달성 조건 조회
router.get('/requirements',
    requireFields(['level']),
    levelController.getLevelRequirements
);

// 경험치 획득
router.post('/experience',
    requireFields(['amount', 'type', 'description']),
    levelController.gainExperience
);

module.exports = router;