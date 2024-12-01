const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireFields } = require('../middlewares/validator.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 내 프로필 조회
router.get('/', profileController.getMyProfile);

// 상태 메시지 업데이트
router.put('/status',
    requireFields(['message']),
    profileController.updateStatus
);

module.exports = router;