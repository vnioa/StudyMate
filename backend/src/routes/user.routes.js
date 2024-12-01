const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validateId, requireFields } = require('../middlewares/validator.middleware');
const upload = require('../middlewares/upload.middleware');

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
    requireFields(['backgroundImage', 'profileImage', 'name', 'bio']),
    userController.updateProfile
);

router.put('/profile/privacy',
    requireFields(['isPublic']),
    userController.updatePrivacy
);

router.post('/profile/:type-image',
    requireFields(['type']),
    upload.single('file'),
    userController.uploadImage
);

// 사용자 정보 관련 라우트
router.get('/info', userController.getUserInfo);

router.put('/info',
    requireFields(['name', 'phone', 'birthdate', 'password']),
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

// 계정 관련 라우트
router.delete('/accounts/:accountId',
    validateId('accountId'),
    userController.disconnectAccount
);

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