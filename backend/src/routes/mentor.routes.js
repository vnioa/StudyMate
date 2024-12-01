const express = require('express');
const router = express.Router();
const mentorController = require('../controllers/mentor.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validateId, requireFields } = require('../middlewares/validator.middleware');
const { upload } = require('../middlewares/upload.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 멘토 정보 유효성 검사
router.post('/validate',
    requireFields(['name', 'field', 'career', 'introduction']),
    mentorController.validateMentorInfo
);

// 멘토 프로필 이미지 업로드
router.post('/image',
    upload.single('image'),
    mentorController.uploadMentorImage
);

// 멘토 등록
router.post('/register',
    requireFields(['name', 'field', 'career', 'introduction']),
    mentorController.registerMentor
);

// 멘토 정보 조회
router.get('/:mentorId',
    validateId('mentorId'),
    mentorController.getMentorInfo
);

// 멘토 정보 수정
router.put('/:mentorId',
    validateId('mentorId'),
    mentorController.updateMentorInfo
);

module.exports = router;