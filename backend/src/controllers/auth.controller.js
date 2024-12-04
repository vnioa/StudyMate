const authService = require('../services/auth.service');
const { CustomError } = require('../utils/error.utils');

const authController = {
    // 인증 코드 발송
    sendAuthCode: async (req, res, next) => {
        try {
            const { name, email, type } = req.body;

            await authService.sendAuthCode(email, name, type);

            return res.status(200).json({
                success: true,
                message: '인증 코드가 성공적으로 발송되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 인증 코드 확인
    verifyAuthCode: async (req, res, next) => {
        try {
            const { email, authCode, type } = req.body;

            const isValid = await authService.verifyAuthCode(email, authCode, type);

            if (!isValid) {
                throw new CustomError('유효하지 않은 인증 코드입니다.', 400);
            }

            return res.status(200).json({
                success: true,
                message: '인증이 완료되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 로그인
    login: async (req, res, next) => {
        try {
            const { userId, password } = req.body;
            const clientIp = req.ip;

            const { user, accessToken, refreshToken } = await authService.login(userId, password, clientIp);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
            });

            return res.status(200).json({
                success: true,
                message: '로그인에 성공했습니다.',
                data: {
                    user,
                    accessToken
                }
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 로그아웃
    logout: async (req, res, next) => {
        try {
            res.clearCookie('refreshToken');

            return res.status(200).json({
                success: true,
                message: '로그아웃되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 비밀번호 재설정
    resetPassword: async (req, res, next) => {
        try {
            const { email, userId, newPassword } = req.body;

            await authService.resetPassword(email, userId, newPassword);

            return res.status(200).json({
                success: true,
                message: '비밀번호가 성공적으로 재설정되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 네이버 로그인
    naverLogin: async (req, res, next) => {
        try {
            const { accessToken, userInfo } = req.body;

            const { user, token } = await authService.handleNaverLogin(accessToken, userInfo);

            return res.status(200).json({
                success: true,
                message: '네이버 로그인에 성공했습니다.',
                data: { user, token }
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 카카오 로그인
    kakaoLogin: async (req, res, next) => {
        try {
            const { accessToken, userInfo } = req.body;

            const { user, token } = await authService.handleKakaoLogin(accessToken, userInfo);

            return res.status(200).json({
                success: true,
                message: '카카오 로그인에 성공했습니다.',
                data: { user, token }
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 로그인 상태 확인
    checkLoginStatus: async (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: '로그인이 필요합니다.'
                });
            }

            const user = await authService.verifyToken(token);

            return res.status(200).json({
                success: true,
                data: { user }
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 토큰 갱신
    refresh: async (req, res, next) => {
        try {
            const { refreshToken } = req.body;

            const { accessToken, newRefreshToken } = await authService.refreshToken(refreshToken);

            return res.status(200).json({
                success: true,
                data: { accessToken, refreshToken: newRefreshToken }
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 회원가입
    register: async (req, res, next) => {
        try {
            const userData = req.body;

            const newUser = await authService.register(userData);

            return res.status(201).json({
                success: true,
                message: '회원가입이 완료되었습니다.',
                data: newUser
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 아이디 중복 확인
    checkUsername: async (req, res, next) => {
        try {
            const { username } = req.params;

            const exists = await authService.checkUsernameExists(username);

            return res.status(200).json({
                success: true,
                data: { exists }
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    }
};

module.exports = authController;