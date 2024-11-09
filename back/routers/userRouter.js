const express = require('express');
const {
    checkUsername,
    registerUser,
    sendVerificationCode,
    loginUser,
    validateToken,
    findUserId,
    resetPassword
} = require('../controllers/userController');

const router = express.Router();

// 아이디 중복 확인 라우트
router.post('/check-username', checkUsername);

// 회원가입 요청 처리
router.post('/register', registerUser);

// 이메일 인증 코드 발송
router.post('/send-verification-code', sendVerificationCode);

// 로그인 요청 처리
router.post('/login', loginUser);

// 토큰 검증 요청 처리
router.post('/validate-token', validateToken);

// 비밀번호 재설정 요청 처리
router.post('/reset-password', resetPassword);

// 아이디 찾기 요청 처리
router.post('/find-id', findUserId);

module.exports = router;
