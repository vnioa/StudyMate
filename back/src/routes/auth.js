const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireFields } = require('../middlewares/validator.middleware');

// 인증 코드 관련 라우트
router.post('/send-code',
    requireFields(['email', 'name', 'type']),
    authController.sendAuthCode
);

router.post('/verify-code',
    requireFields(['email', 'authCode']),
    authController.verifyAuthCode
);

// 로그인 관련 라우트
router.post('/login',
    requireFields(['userId', 'password']),
    authController.login
);

router.post('/logout', authController.logout);

// 소셜 로그인 라우트
router.post('/social-login',
    requireFields(['provider', 'accessToken', 'userInfo']),
    authController.handleSocialLogin
);

router.post('/naver',
    requireFields(['accessToken', 'userInfo']),
    authController.naverLogin
);

router.post('/kakao',
    requireFields(['accessToken', 'userInfo']),
    authController.kakaoLogin
);

// 토큰 관련 라우트
router.post('/refresh',
    requireFields(['refreshToken']),
    authController.refreshToken
);

// 로그인 상태 확인
router.get('/status',
    authenticateToken,
    authController.checkLoginStatus
);

module.exports = router;