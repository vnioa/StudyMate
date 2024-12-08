const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireFields } = require('../middlewares/validator.middleware');
const { createUploadMiddleware, processUploadedFile } = require('../middlewares/upload.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 내 프로필 조회
router.get('/', profileController.getMyProfile);

// 프로필 수정
router.put('/',
    requireFields(['nickname', 'bio']),
    profileController.updateProfile
);

// 상태 메시지 업데이트
router.put('/status',
    requireFields(['message']),
    profileController.updateStatus
);

// 프로필 이미지 업로드
router.post('/image',
    createUploadMiddleware('profile')[0],
    processUploadedFile,
    profileController.uploadProfileImage
);

// 배경 이미지 업로드
router.post('/background',
    createUploadMiddleware('profile')[0],
    processUploadedFile,
    profileController.uploadBackgroundImage
);

// 활동 상태 업데이트
router.put('/activity-status',
    requireFields(['status']),
    profileController.updateActivityStatus
);

// 프로필 공개 범위 설정
router.put('/visibility',
    requireFields(['visibility']),
    profileController.updateVisibility
);

module.exports = router;