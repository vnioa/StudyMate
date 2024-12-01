const { dbUtils } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const authService = {
    // 인증 코드 발송
    async sendAuthCode(data) {
        try {
            const authCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const expiryTime = new Date(Date.now() + 5 * 60000); // 5분 후 만료

            await dbUtils.query(
                'UPDATE auth SET authCode = ?, authCodeExpires = ? WHERE email = ?',
                [authCode, expiryTime, data.email]
            );

            // 이메일 발송 로직 구현 필요
            // TODO: 실제 이메일 발송 구현

            return { success: true };
        } catch (error) {
            throw new Error('인증 코드 발송 실패: ' + error.message);
        }
    },

    // 인증 코드 확인
    async verifyAuthCode(data) {
        try {
            const result = await dbUtils.query(
                `SELECT * FROM auth
                 WHERE email = ? AND authCode = ?
                   AND authCodeExpires > NOW()`,
                [data.email, data.authCode]
            );

            if (result.length === 0) {
                throw new Error('유효하지 않은 인증 코드');
            }

            return { success: true, userId: result[0].userId };
        } catch (error) {
            throw new Error('인증 코드 확인 실패: ' + error.message);
        }
    },

    // 로그인
    async login(data) {
        try {
            const user = await dbUtils.query(
                'SELECT * FROM auth WHERE userId = ?',
                [data.userId]
            );

            if (user.length === 0) {
                throw new Error('사용자를 찾을 수 없습니다');
            }

            const isValid = await bcrypt.compare(data.password, user[0].password);
            if (!isValid) {
                throw new Error('비밀번호가 일치하지 않습니다');
            }

            const accessToken = jwt.sign(
                { userId: user[0].userId },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            const refreshToken = jwt.sign(
                { userId: user[0].userId },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: '7d' }
            );

            await dbUtils.query(
                'UPDATE auth SET refreshToken = ?, lastLogin = NOW() WHERE userId = ?',
                [refreshToken, user[0].userId]
            );

            return {
                accessToken,
                refreshToken,
                user: {
                    id: user[0].userId,
                    name: user[0].name,
                    email: user[0].email
                }
            };
        } catch (error) {
            throw new Error('로그인 실패: ' + error.message);
        }
    },

    // 회원가입
    async register(userData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const hashedPassword = await bcrypt.hash(userData.password, 10);

                const result = await connection.query(
                    `INSERT INTO auth (
                        userId, username, password, name, email,
                        birthdate, phoneNumber, provider
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        userData.username,
                        userData.username,
                        hashedPassword,
                        userData.name,
                        userData.email,
                        userData.birthdate,
                        userData.phoneNumber,
                        'local'
                    ]
                );

                return {
                    success: true,
                    userId: result.insertId
                };
            } catch (error) {
                throw new Error('회원가입 실패: ' + error.message);
            }
        });
    },

    // 소셜 로그인 (구글)
    async googleLogin(data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                let user = await connection.query(
                    'SELECT * FROM auth WHERE provider = ? AND socialId = ?',
                    ['google', data.userInfo.id]
                );

                if (user.length === 0) {
                    // 새 사용자 생성
                    const result = await connection.query(
                        `INSERT INTO auth (
                            provider, socialId, email, name, profileImage
                        ) VALUES (?, ?, ?, ?, ?)`,
                        [
                            'google',
                            data.userInfo.id,
                            data.userInfo.email,
                            data.userInfo.name,
                            data.userInfo.profileImage
                        ]
                    );
                    user = [{ id: result.insertId, ...data.userInfo }];
                }

                const accessToken = jwt.sign(
                    { userId: user[0].id },
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' }
                );

                return {
                    success: true,
                    accessToken,
                    user: user[0]
                };
            } catch (error) {
                throw new Error('구글 로그인 실패: ' + error.message);
            }
        });
    },

    async kakaoLogin(data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 기존 사용자 확인
                const [existingUser] = await connection.query(
                    'SELECT * FROM auth WHERE provider = ? AND socialId = ?',
                    ['kakao', data.userInfo.id]
                );

                let userId;
                if (!existingUser) {
                    // 새 사용자 생성
                    const [result] = await connection.query(
                        `INSERT INTO auth (
                            username,
                            email,
                            name,
                            provider,
                            socialId,
                            profileImage,
                            status
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            `kakao_${data.userInfo.id}`,
                            data.userInfo.email,
                            data.userInfo.name,
                            'kakao',
                            data.userInfo.id,
                            data.userInfo.profileImage,
                            'active'
                        ]
                    );
                    userId = result.insertId;
                } else {
                    userId = existingUser.id;
                }

                // 토큰 생성
                const accessToken = jwt.sign(
                    { userId: userId },
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' }
                );

                const refreshToken = jwt.sign(
                    { userId: userId },
                    process.env.JWT_REFRESH_SECRET,
                    { expiresIn: '7d' }
                );

                // 리프레시 토큰 저장
                await connection.query(
                    'UPDATE auth SET refreshToken = ?, lastLogin = NOW() WHERE id = ?',
                    [refreshToken, userId]
                );

                return {
                    success: true,
                    data: {
                        token: accessToken,
                        refreshToken: refreshToken,
                        user: {
                            id: userId,
                            email: data.userInfo.email,
                            name: data.userInfo.name,
                            profileImage: data.userInfo.profileImage
                        }
                    }
                };
            } catch (error) {
                throw new Error('카카오 로그인 실패: ' + error.message);
            }
        });
    },

    async logout() {
        try {
            // 리프레시 토큰 삭제
            await dbUtils.query(
                'UPDATE auth SET refreshToken = NULL WHERE userId = ?',
                [req.user.id]
            );

            // 마지막 로그아웃 시간 업데이트
            await dbUtils.query(
                'UPDATE auth SET lastLogin = NOW() WHERE userId = ?',
                [req.user.id]
            );

            return {
                success: true
            };
        } catch (error) {
            throw new Error('로그아웃 실패: ' + error.message);
        }
    },

    // 비밀번호 재설정
    async resetPassword(data) {
        try {
            // 사용자 확인
            const [user] = await dbUtils.query(
                'SELECT * FROM auth WHERE email = ? AND userId = ?',
                [data.email, data.userId]
            );

            if (!user) {
                throw new Error('사용자를 찾을 수 없습니다');
            }

            // 새 비밀번호 해시화
            const hashedPassword = await bcrypt.hash(data.newPassword, 10);

            // 비밀번호 업데이트
            await dbUtils.query(
                'UPDATE auth SET password = ? WHERE id = ?',
                [hashedPassword, user.id]
            );

            return { success: true };
        } catch (error) {
            throw new Error('비밀번호 재설정 실패: ' + error.message);
        }
    },

// 토큰 갱신
    async refresh(data) {
        try {
            // 리프레시 토큰 검증
            const decoded = jwt.verify(data.refreshToken, process.env.JWT_REFRESH_SECRET);

            // DB에서 사용자 확인
            const [user] = await dbUtils.query(
                'SELECT * FROM auth WHERE userId = ? AND refreshToken = ?',
                [decoded.userId, data.refreshToken]
            );

            if (!user) {
                throw new Error('유효하지 않은 리프레시 토큰');
            }

            // 새로운 액세스 토큰 발급
            const accessToken = jwt.sign(
                { userId: user.userId },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            return { accessToken };
        } catch (error) {
            throw new Error('토큰 갱신 실패: ' + error.message);
        }
    },

// 로그인 상태 확인
    async checkLoginStatus() {
        try {
            // 현재 사용자 정보 조회
            const [user] = await dbUtils.query(
                'SELECT id, email, name, status, lastLogin FROM auth WHERE userId = ?',
                [req.user.id]
            );

            if (!user) {
                throw new Error('인증되지 않은 사용자');
            }

            return {
                success: true,
                isLoggedIn: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    status: user.status,
                    lastLogin: user.lastLogin
                }
            };
        } catch (error) {
            throw new Error('로그인 상태 확인 실패: ' + error.message);
        }
    },

// 아이디 중복 확인
    async checkUsername(username) {
        try {
            const [existingUser] = await dbUtils.query(
                'SELECT COUNT(*) as count FROM auth WHERE username = ?',
                [username]
            );

            return {
                available: existingUser.count === 0
            };
        } catch (error) {
            throw new Error('아이디 중복 확인 실패: ' + error.message);
        }
    }
};

module.exports = authService;