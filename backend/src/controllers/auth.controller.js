const authService = require('../services/auth.service');

const authController = {
    // 인증 코드 발송
    sendAuthCode: async (req, res) => {
        try {
            const result = await authService.sendAuthCode(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 인증 코드 확인
    verifyAuthCode: async (req, res) => {
        try {
            const result = await authService.verifyAuthCode(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 로그인
    login: async (req, res) => {
        try {
            const result = await authService.login(req.body);
            res.json(result);
        } catch (error) {
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    },

    // 로그아웃
    logout: async (req, res) => {
        try {
            const result = await authService.logout();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 비밀번호 재설정
    resetPassword: async (req, res) => {
        try {
            const result = await authService.resetPassword(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 구글 로그인
    googleLogin: async (req, res) => {
        try {
            const result = await authService.googleLogin(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 카카오 로그인
    kakaoLogin: async (req, res) => {
        try {
            const result = await authService.kakaoLogin(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 로그인 상태 확인
    checkLoginStatus: async (req, res) => {
        try {
            const result = await authService.checkLoginStatus();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 토큰 갱신
    refresh: async (req, res) => {
        try {
            const result = await authService.refresh(req.body);
            res.json(result);
        } catch (error) {
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    },

    // 회원가입
    register: async (req, res) => {
        try {
            const result = await authService.register(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 아이디 중복 확인
    checkUsername: async (req, res) => {
        try {
            const result = await authService.checkUsername(req.params.username);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = authController;