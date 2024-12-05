const db = require('../config/db');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// 유틸리티 함수들
const utils = {
    generateVerificationCode: () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },

    async hashPassword(password) {
        return await bcrypt.hash(password, 12);
    },

    generateToken(payload, secret, expiresIn) {
        return jwt.sign(payload, secret, { expiresIn });
    },

    async verifyToken(token, secret) {
        try {
            return jwt.verify(token, secret);
        } catch (error) {
            throw new Error('토큰 검증 실패');
        }
    },

    async sendEmail(to, subject, html) {
        const transporter = nodemailer.createTransport({
            host: 'smtp.naver.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.NAVER_EMAIL,
                pass: process.env.NAVER_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: process.env.NAVER_EMAIL,
            to,
            subject,
            html,
        });
    }
};

const authController = {
    // 인증 코드 발송
    sendAuthCode: async (req, res) => {
        try {
            const { email, name, type } = req.body;
            const code = utils.generateVerificationCode();

            await utils.sendEmail(
                email,
                `[StudyMate] ${type === 'register' ? '회원가입' : '비밀번호 재설정'} 인증코드`,
                `<h3>${name}님, 안녕하세요.</h3>
         <p>인증 코드: <strong>${code}</strong></p>
         <p>인증 코드는 10분간 유효합니다.</p>`
            );

            await db.execute(
                'UPDATE auth SET authCode = ?, authCodeExpires = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE email = ?',
                [code, email]
            );

            res.status(200).json({
                success: true,
                message: '인증 코드가 발송되었습니다.'
            });
        } catch (error) {
            console.error('인증 코드 발송 오류:', error);
            res.status(500).json({
                success: false,
                message: '인증 코드 발송에 실패했습니다.'
            });
        }
    },

    // 인증 코드 확인
    verifyAuthCode: async (req, res) => {
        try {
            const { email, authCode } = req.body;

            const [result] = await db.execute(
                'SELECT * FROM auth WHERE email = ? AND authCode = ? AND authCodeExpires > NOW()',
                [email, authCode]
            );

            if (!result.length) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 인증 코드입니다.'
                });
            }

            await db.execute(
                'UPDATE auth SET authCode = NULL, authCodeExpires = NULL WHERE email = ?',
                [email]
            );

            res.status(200).json({
                success: true,
                message: '인증이 완료되었습니다.'
            });
        } catch (error) {
            console.error('인증 코드 확인 오류:', error);
            res.status(500).json({
                success: false,
                message: '인증 코드 확인에 실패했습니다.'
            });
        }
    },

    // 로그인
    login: async (req, res) => {
        try {
            const { userId, password } = req.body;
            const clientIp = req.ip;

            const [user] = await db.execute(
                'SELECT * FROM auth WHERE (username = ? OR email = ?) AND provider = "local"',
                [userId, userId]
            );

            if (!user.length || !(await bcrypt.compare(password, user[0].password))) {
                return res.status(401).json({
                    success: false,
                    message: '아이디 또는 비밀번호가 일치하지 않습니다.'
                });
            }

            const accessToken = utils.generateToken(
                { id: user[0].id },
                process.env.JWT_SECRET,
                '1h'
            );

            const refreshToken = utils.generateToken(
                { id: user[0].id },
                process.env.JWT_REFRESH_SECRET,
                '7d'
            );

            await db.execute(
                'UPDATE auth SET refreshToken = ?, lastLogin = NOW(), loginIp = ? WHERE id = ?',
                [refreshToken, clientIp, user[0].id]
            );

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            delete user[0].password;
            delete user[0].refreshToken;

            res.status(200).json({
                success: true,
                data: { user: user[0], accessToken }
            });
        } catch (error) {
            console.error('로그인 오류:', error);
            res.status(500).json({
                success: false,
                message: '로그인에 실패했습니다.'
            });
        }
    },

    // 소셜 로그인 처리
    handleSocialLogin: async (req, res) => {
        try {
            const { provider, accessToken, userInfo } = req.body;

            const [existingUser] = await db.execute(
                'SELECT * FROM auth WHERE provider = ? AND socialId = ?',
                [provider, userInfo.id]
            );

            let user = existingUser[0];

            if (!user) {
                const [result] = await db.execute(
                    `INSERT INTO auth (username, email, name, provider, socialId, password, status)
           VALUES (?, ?, ?, ?, ?, ?, 'active')`,
                    [
                        `${provider}_${userInfo.id}`,
                        userInfo.email,
                        userInfo.name,
                        provider,
                        userInfo.id,
                        await utils.hashPassword(Math.random().toString(36))
                    ]
                );

                [user] = await db.execute(
                    'SELECT * FROM auth WHERE id = ?',
                    [result.insertId]
                );
            }

            const token = utils.generateToken(
                { id: user.id },
                process.env.JWT_SECRET,
                '1h'
            );

            res.status(200).json({
                success: true,
                data: { user, token }
            });
        } catch (error) {
            console.error('소셜 로그인 오류:', error);
            res.status(500).json({
                success: false,
                message: '소셜 로그인에 실패했습니다.'
            });
        }
    },

    // 로그아웃
    logout: async (req, res) => {
        try {
            res.clearCookie('refreshToken');
            res.status(200).json({
                success: true,
                message: '로그아웃되었습니다.'
            });
        } catch (error) {
            console.error('로그아웃 오류:', error);
            res.status(500).json({
                success: false,
                message: '로그아웃에 실패했습니다.'
            });
        }
    },

    // 토큰 갱신
    refreshToken: async (req, res) => {
        try {
            const { refreshToken } = req.body;

            const decoded = await utils.verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
            const [user] = await db.execute(
                'SELECT * FROM auth WHERE id = ? AND refreshToken = ?',
                [decoded.id, refreshToken]
            );

            if (!user.length) {
                return res.status(401).json({
                    success: false,
                    message: '유효하지 않은 갱신 토큰입니다.'
                });
            }

            const newAccessToken = utils.generateToken(
                { id: user[0].id },
                process.env.JWT_SECRET,
                '1h'
            );

            const newRefreshToken = utils.generateToken(
                { id: user[0].id },
                process.env.JWT_REFRESH_SECRET,
                '7d'
            );

            await db.execute(
                'UPDATE auth SET refreshToken = ? WHERE id = ?',
                [newRefreshToken, user[0].id]
            );

            res.status(200).json({
                success: true,
                data: { accessToken: newAccessToken, refreshToken: newRefreshToken }
            });
        } catch (error) {
            console.error('토큰 갱신 오류:', error);
            res.status(500).json({
                success: false,
                message: '토큰 갱신에 실패했습니다.'
            });
        }
    },

    // 로그인 상태 확인
    checkLoginStatus: async (req, res) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: '로그인이 필요합니다.'
                });
            }

            const decoded = await utils.verifyToken(token, process.env.JWT_SECRET);
            const [user] = await db.execute(
                'SELECT * FROM auth WHERE id = ? AND status = "active"',
                [decoded.id]
            );

            if (!user.length) {
                return res.status(401).json({
                    success: false,
                    message: '유효하지 않은 사용자입니다.'
                });
            }

            delete user[0].password;
            delete user[0].refreshToken;

            res.status(200).json({
                success: true,
                data: { user: user[0] }
            });
        } catch (error) {
            console.error('로그인 상태 확인 오류:', error);
            res.status(401).json({
                success: false,
                message: '인증이 필요합니다.'
            });
        }
    },

    // 네이버 로그인
    naverLogin: async (req, res) => {
        try {
            const { accessToken, userInfo } = req.body;

            const [existingUser] = await db.execute(
                'SELECT * FROM auth WHERE provider = "naver" AND socialId = ?',
                [userInfo.id]
            );

            let user = existingUser[0];
            let token;

            if (!user) {
                const hashedPassword = await utils.hashPassword(Math.random().toString(36));
                const [result] = await db.execute(
                    `INSERT INTO auth (username, email, name, provider, socialId, password, status)
           VALUES (?, ?, ?, 'naver', ?, ?, 'active')`,
                    [`naver_${userInfo.id}`, userInfo.email, userInfo.name, userInfo.id, hashedPassword]
                );

                [user] = await db.execute('SELECT * FROM auth WHERE id = ?', [result.insertId]);
            }

            token = utils.generateToken({ id: user.id }, process.env.JWT_SECRET, '1h');

            res.status(200).json({
                success: true,
                message: '네이버 로그인에 성공했습니다.',
                data: { user, token }
            });
        } catch (error) {
            console.error('네이버 로그인 오류:', error);
            res.status(500).json({
                success: false,
                message: '네이버 로그인에 실패했습니다.'
            });
        }
    },

    // 카카오 로그인
    kakaoLogin: async (req, res) => {
        try {
            const { accessToken, userInfo } = req.body;

            const [existingUser] = await db.execute(
                'SELECT * FROM auth WHERE provider = "kakao" AND socialId = ?',
                [userInfo.id]
            );

            let user = existingUser[0];
            let token;

            if (!user) {
                const hashedPassword = await utils.hashPassword(Math.random().toString(36));
                const [result] = await db.execute(
                    `INSERT INTO auth (username, email, name, provider, socialId, password, status)
           VALUES (?, ?, ?, 'kakao', ?, ?, 'active')`,
                    [`kakao_${userInfo.id}`, userInfo.email, userInfo.name, userInfo.id, hashedPassword]
                );

                [user] = await db.execute('SELECT * FROM auth WHERE id = ?', [result.insertId]);
            }

            token = utils.generateToken({ id: user.id }, process.env.JWT_SECRET, '1h');

            res.status(200).json({
                success: true,
                message: '카카오 로그인에 성공했습니다.',
                data: { user, token }
            });
        } catch (error) {
            console.error('카카오 로그인 오류:', error);
            res.status(500).json({
                success: false,
                message: '카카오 로그인에 실패했습니다.'
            });
        }
    }
};

module.exports = authController;