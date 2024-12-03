const authService = require('../services/auth.service');
const { CustomError } = require('../utils/error.utils');
const { validateEmail, validatePassword } = require('../utils/validator.utils');

const authController = {
    // 회원가입
    async register(req, res, next) {
        try {
            const userData = req.body;

            // 이메일 형식 검증
            if (!validateEmail(userData.email)) {
                throw new CustomError('유효하지 않은 이메일 형식입니다.', 400);
            }

            // 비밀번호 유효성 검증
            if (!validatePassword(userData.password)) {
                throw new CustomError('비밀번호는 8자 이상이며, 영문, 숫자, 특수문자를 포함해야 합니다.', 400);
            }

            const result = await authService.register(userData);
            res.status(201).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 로그인
    async login(req, res, next) {
        try {
            const { userId, password } = req.body;
            const clientIp = req.ip;

            const result = await authService.login(userId, password, clientIp);

            // 토큰을 쿠키에 저장
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
            });

            res.json({
                success: true,
                data: {
                    accessToken: result.accessToken,
                    user: result.user
                }
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 로그아웃
    async logout(req, res, next) {
        try {
            const refreshToken = req.cookies.refreshToken;
            await authService.logout(refreshToken);

            res.clearCookie('refreshToken');
            res.json({
                success: true,
                message: '로그아웃되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 인증 코드 발송
    async sendAuthCode(req, res, next) {
        try {
            const { email, name, type } = req.body;

            if (!validateEmail(email)) {
                throw new CustomError('유효하지 않은 이메일 형식입니다.', 400);
            }

            await authService.sendAuthCode(email, name, type);
            res.json({
                success: true,
                message: '인증 코드가 발송되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 인증 코드 확인
    async verifyAuthCode(req, res, next) {
        try {
            const { email, authCode, type } = req.body;
            await authService.verifyAuthCode(email, authCode, type);

            res.json({
                success: true,
                message: '인증이 완료되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 비밀번호 재설정
    async resetPassword(req, res, next) {
        try {
            const { email, userId, newPassword } = req.body;

            if (!validatePassword(newPassword)) {
                throw new CustomError('비밀번호는 8자 이상이며, 영문, 숫자, 특수문자를 포함해야 합니다.', 400);
            }

            await authService.resetPassword(email, userId, newPassword);
            res.json({
                success: true,
                message: '비밀번호가 재설정되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 소셜 로그인 - 네이버
    async naverLogin(req, res, next) {
        try {
            const { accessToken, userInfo } = req.body;
            const result = await authService.naverLogin(accessToken, userInfo);

            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({
                success: true,
                data: {
                    accessToken: result.accessToken,
                    user: result.user
                }
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 소셜 로그인 - 카카오
    async kakaoLogin(req, res, next) {
        try {
            const { accessToken, userInfo } = req.body;
            const result = await authService.kakaoLogin(accessToken, userInfo);

            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({
                success: true,
                data: {
                    accessToken: result.accessToken,
                    user: result.user
                }
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 로그인 상태 확인
    async checkLoginStatus(req, res, next) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            const result = await authService.checkLoginStatus(token);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 토큰 갱신
    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await authService.refresh(refreshToken);

            res.json({
                success: true,
                data: {
                    accessToken: result.accessToken
                }
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 아이디 중복 확인
    async checkUsername(req, res, next) {
        try {
            const { username } = req.params;
            const result = await authService.checkUsername(username);

            res.json({
                success: true,
                data: {
                    available: result
                }
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    }
};

module.exports = authController;