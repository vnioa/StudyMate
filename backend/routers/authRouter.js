const express = require('express');
const {
    sendAuthCode,
    verifyAuthCode,
    login,
    logout,
    resetPassword,
    googleLogin,
    kakaoLogin,
    checkLoginStatus,
    refresh,
    register,
    checkUsername
} = require('../controllers/authController');

const router = express.Router();

// 인증 코드 관련 라우트
router.post('/send-code', sendAuthCode);
router.post('/verify-code', verifyAuthCode);

// 로그인/로그아웃 라우트
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);

// 비밀번호 관련 라우트
router.post('/reset-password', resetPassword);

// 소셜 로그인 라우트
router.post('/google', googleLogin);
router.post('/kakao', kakaoLogin);

// 회원가입 관련 라우트
router.post('/register', register);
router.post('/check-username', checkUsername);

// 로그인 상태 확인 라우트
router.get('/status', checkLoginStatus);

module.exports = router;
