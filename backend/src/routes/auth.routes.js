const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateId, requireFields } = require('../middlewares/validator.middleware');

// 인증 코드 발송
router.post('/send-code',
    requireFields(['name', 'email', 'type']),
    authController.sendAuthCode
);

// 인증 코드 확인
router.post('/verify-code',
    requireFields(['email', 'authCode', 'type']),
    authController.verifyAuthCode
);

// 로그인
router.post('/login',
    requireFields(['userId', 'password']),
    authController.login
);

// 로그아웃
router.post('/logout', authController.logout);

// 비밀번호 재설정
router.post('/reset-password',
    requireFields(['email', 'userId', 'newPassword']),
    authController.resetPassword
);

// 구글 로그인
router.post('/google',
    requireFields(['accessToken', 'userInfo']),
    authController.googleLogin
);

// 카카오 로그인
router.post('/kakao',
    requireFields(['accessToken', 'userInfo']),
    authController.kakaoLogin
);

// 로그인 상태 확인
router.get('/status', authController.checkLoginStatus);

// 토큰 갱신
router.post('/refresh',
    requireFields(['refreshToken']),
    authController.refresh
);

// 회원가입
router.post('/register',
    requireFields(['username', 'password', 'name', 'birthdate', 'phoneNumber', 'email']),
    authController.register
);

// 아이디 중복 확인
router.get('/check-username/:username',
    validateId('username'),
    authController.checkUsername
);

module.exports = router;