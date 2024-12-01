const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { sendEmail } = require('../utils/email');
const { generateAuthCode, verifyGoogleToken, verifyKakaoToken } = require('../utils/auth');

const authService = {
    // 인증 코드 발송
    sendAuthCode: async (data) => {
        const { name, email, type, userId } = data;

        try {
            const authCode = generateAuthCode();
            await sendEmail(email, authCode);

            // 인증 코드 저장
            if (userId) {
                await User.findByIdAndUpdate(userId, {
                    $push: { authCodes: { code: authCode, type } }
                });
            }

            return { success: true };
        } catch (error) {
            throw new Error('인증 코드 발송에 실패했습니다.');
        }
    },

    // 인증 코드 확인
    verifyAuthCode: async (data) => {
        const { email, authCode, type } = data;

        try {
            const user = await User.findOne({ email });
            if (!user) throw new Error('사용자를 찾을 수 없습니다.');

            const isValid = await user.verifyAuthCode(authCode, type);
            if (!isValid) throw new Error('유효하지 않은 인증 코드입니다.');

            return {
                success: true,
                userId: type === 'id' ? user._id : undefined
            };
        } catch (error) {
            throw error;
        }
    },

    // 로그인
    login: async (data) => {
        const { userId, password } = data;

        try {
            const user = await User.findOne({ userId });
            if (!user) throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');

            const isValidPassword = await user.comparePassword(password);
            if (!isValidPassword) throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');

            const accessToken = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            const refreshToken = jwt.sign(
                { userId: user._id },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: '7d' }
            );

            await user.addRefreshToken(refreshToken);

            return {
                accessToken,
                refreshToken,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email
                }
            };
        } catch (error) {
            throw error;
        }
    },

    // 로그아웃
    logout: async () => {
        try {
            return { success: true };
        } catch (error) {
            throw error;
        }
    },

    // 비밀번호 재설정
    resetPassword: async (data) => {
        const { email, userId, newPassword } = data;

        try {
            const user = await User.findOne({ email, userId });
            if (!user) throw new Error('사용자를 찾을 수 없습니다.');

            user.password = newPassword;
            await user.save();

            return { success: true };
        } catch (error) {
            throw error;
        }
    },

    // 구글 로그인
    googleLogin: async (data) => {
        const { accessToken, userInfo } = data;

        try {
            const isValid = await verifyGoogleToken(accessToken);
            if (!isValid) throw new Error('유효하지 않은 토큰입니다.');

            let user = await User.findOne({ 'socialAccounts.socialId': userInfo.id });
            if (!user) {
                user = await User.create({
                    email: userInfo.email,
                    name: userInfo.name,
                    socialAccounts: [{
                        provider: 'google',
                        socialId: userInfo.id,
                        email: userInfo.email
                    }]
                });
            }

            const token = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            const refreshToken = jwt.sign(
                { userId: user._id },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: '7d' }
            );

            return {
                success: true,
                data: { token, refreshToken, user }
            };
        } catch (error) {
            throw error;
        }
    },

    // 카카오 로그인
    kakaoLogin: async (data) => {
        const { accessToken, userInfo } = data;

        try {
            const isValid = await verifyKakaoToken(accessToken);
            if (!isValid) throw new Error('유효하지 않은 토큰입니다.');

            let user = await User.findOne({ 'socialAccounts.socialId': userInfo.id });
            if (!user) {
                user = await User.create({
                    email: userInfo.email,
                    name: userInfo.name,
                    socialAccounts: [{
                        provider: 'kakao',
                        socialId: userInfo.id,
                        email: userInfo.email
                    }]
                });
            }

            const token = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            const refreshToken = jwt.sign(
                { userId: user._id },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: '7d' }
            );

            return {
                success: true,
                data: { token, refreshToken, user }
            };
        } catch (error) {
            throw error;
        }
    },

    // 로그인 상태 확인
    checkLoginStatus: async () => {
        try {
            return { success: true };
        } catch (error) {
            throw error;
        }
    },

    // 토큰 갱신
    refresh: async (data) => {
        const { refreshToken } = data;

        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const user = await User.findById(decoded.userId);

            if (!user) throw new Error('사용자를 찾을 수 없습니다.');

            const hasToken = user.refreshTokens.some(rt => rt.token === refreshToken);
            if (!hasToken) throw new Error('유효하지 않은 리프레시 토큰입니다.');

            const accessToken = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            return { accessToken };
        } catch (error) {
            throw error;
        }
    },

    // 회원가입
    register: async (data) => {
        try {
            const user = await User.create(data);

            const token = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            const refreshToken = jwt.sign(
                { userId: user._id },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: '7d' }
            );

            return {
                success: true,
                data: {
                    token,
                    refreshToken,
                    user: {
                        username: user.username
                    }
                }
            };
        } catch (error) {
            throw error;
        }
    },

    // 아이디 중복 확인
    checkUsername: async (username) => {
        try {
            const exists = await User.exists({ username });
            return { available: !exists };
        } catch (error) {
            throw error;
        }
    }
};

module.exports = authService;