const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validateId, requireFields } = require('../middlewares/validator.middleware');
const { createUploadMiddleware, processUploadedFile } = require('../middlewares/upload.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 이름 관련 라우트
router.post('/validate-name',
    requireFields(['name']),
    userController.validateName
);

router.put('/name',
    requireFields(['name']),
    userController.updateName
);

// 프로필 관련 라우트
router.get('/profile', userController.getProfile);

router.put('/profile',
    requireFields(['bio', 'phone', 'birthdate']),
    userController.updateProfile
);

router.put('/profile/privacy',
    requireFields(['isPublic']),
    userController.updatePrivacy
);

// 이미지 업로드 라우트
router.post('/profile/:type/image',
    createUploadMiddleware('profile')[0],
    processUploadedFile,
    userController.uploadImage
);

// 사용자 정보 관련 라우트
router.get('/info', userController.getUserInfo);

router.put('/info',
    requireFields(['username', 'email', 'phone']),
    userController.updateUserInfo
);

// 유효성 검사 라우트
router.post('/validate-phone',
    requireFields(['phone']),
    userController.validatePhone
);

router.post('/validate-password',
    requireFields(['password']),
    userController.validatePassword
);

// 비밀번호 변경 라우트
router.put('/password',
    requireFields(['currentPassword', 'newPassword']),
    userController.changePassword
);

// 소셜 계정 관련 라우트
router.get('/social-accounts', userController.getSocialAccounts);

router.get('/primary-account', userController.getPrimaryAccount);

router.put('/primary-account/:accountId',
    validateId('accountId'),
    userController.setPrimaryAccount
);

router.delete('/social-accounts/:accountId',
    validateId('accountId'),
    userController.disconnectSocialAccount
);

module.exports = router;