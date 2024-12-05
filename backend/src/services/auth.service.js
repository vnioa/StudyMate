const { dbUtils } = require('../config/database.config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendMail } = require('../utils/email');

const authService = {
    // 인증 코드 발송
    async sendAuthCode(email, name, type) {
        try {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expires = new Date(Date.now() + 10 * 60 * 1000); // 10분 후 만료

            const query = `
                UPDATE auth 
                SET authCode = ?, authCodeExpires = ?
                WHERE email = ?
            `;

            await dbUtils.query(query, [code, expires, email]);

            const mailOptions = {
                to: email,
                subject: `[StudyMate] ${type === 'register' ? '회원가입' : '비밀번호 재설정'} 인증코드`,
                html: `
                    <h3>${name}님, 안녕하세요.</h3>
                    <p>인증 코드: <strong>${code}</strong></p>
                    <p>인증 코드는 3분간 유효합니다.</p>
                `
            };

            await sendMail(mailOptions);
            return true;
        } catch (error) {
            throw new Error('인증 코드 발송 실패: ' + error.message);
        }
    },

    // 인증 코드 확인
    async verifyAuthCode(email, authCode, type) {
        try {
            const query = `
                SELECT * FROM auth 
                WHERE email = ? 
                AND authCode = ? 
                AND authCodeExpires > NOW()
            `;

            const [user] = await dbUtils.query(query, [email, authCode]);

            if (!user) return false;

            // 인증 코드 초기화
            await dbUtils.query(
                'UPDATE auth SET authCode = NULL, authCodeExpires = NULL WHERE email = ?',
                [email]
            );

            return true;
        } catch (error) {
            throw new Error('인증 코드 확인 실패: ' + error.message);
        }
    },

    // 로그인
    async login(userId, password, clientIp) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [user] = await connection.query(`
                    SELECT * FROM auth 
                    WHERE (username = ? OR email = ?)
                    AND provider = 'local'
                `, [userId, userId]);

                if (!user) {
                    throw new Error('존재하지 않는 사용자입니다.');
                }

                if (user.status === 'suspended' || user.failedLoginAttempts >= 5) {
                    throw new Error('계정이 잠겼습니다. 관리자에게 문의하세요.');
                }

                const isValidPassword = await bcrypt.compare(password, user.password);
                if (!isValidPassword) {
                    await connection.query(`
                        UPDATE auth 
                        SET failedLoginAttempts = failedLoginAttempts + 1,
                            status = CASE WHEN failedLoginAttempts + 1 >= 5 THEN 'suspended' ELSE status END
                        WHERE id = ?
                    `, [user.id]);
                    throw new Error('비밀번호가 일치하지 않습니다.');
                }

                const accessToken = jwt.sign(
                    { id: user.id },
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' }
                );

                const refreshToken = jwt.sign(
                    { id: user.id },
                    process.env.JWT_REFRESH_SECRET,
                    { expiresIn: '7d' }
                );

                await connection.query(`
                    UPDATE auth 
                    SET refreshToken = ?,
                        failedLoginAttempts = 0,
                        lastLogin = NOW(),
                        loginIp = ?
                    WHERE id = ?
                `, [refreshToken, clientIp, user.id]);

                delete user.password;
                delete user.refreshToken;

                return { user, accessToken, refreshToken };
            } catch (error) {
                throw new Error('로그인 실패: ' + error.message);
            }
        });
    },

    // 비밀번호 재설정
    async resetPassword(email, userId, newPassword) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const hashedPassword = await bcrypt.hash(newPassword, 12);

                const result = await connection.query(`
                    UPDATE auth 
                    SET password = ?,
                        lastPasswordChange = NOW(),
                        passwordResetToken = NULL,
                        passwordResetExpires = NULL
                    WHERE email = ? AND username = ?
                `, [hashedPassword, email, userId]);

                if (result.affectedRows === 0) {
                    throw new Error('사용자를 찾을 수 없습니다.');
                }

                return true;
            } catch (error) {
                throw new Error('비밀번호 재설정 실패: ' + error.message);
            }
        });
    },

    // 회원가입
    async register(userData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [existingUser] = await connection.query(`
                    SELECT id FROM auth 
                    WHERE email = ? OR username = ?
                `, [userData.email, userData.username]);

                if (existingUser) {
                    throw new Error('이미 존재하는 이메일 또는 아이디입니다.');
                }

                const hashedPassword = await bcrypt.hash(userData.password, 12);

                const [result] = await connection.query(`
                    INSERT INTO auth (
                        username, password, name, email, birthdate, 
                        phoneNumber, provider, status, lastPasswordChange
                    ) VALUES (?, ?, ?, ?, ?, ?, 'local', 'active', NOW())
                `, [
                    userData.username,
                    hashedPassword,
                    userData.name,
                    userData.email,
                    userData.birthdate,
                    userData.phoneNumber
                ]);

                const [newUser] = await connection.query(
                    'SELECT * FROM auth WHERE id = ?',
                    [result.insertId]
                );

                delete newUser.password;
                return newUser;
            } catch (error) {
                throw new Error('회원가입 실패: ' + error.message);
            }
        });
    },

    // 네이버 로그인 처리
    async handleNaverLogin(accessToken, userInfo) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 기존 사용자 확인
                const [user] = await connection.query(
                    'SELECT * FROM auth WHERE provider = "naver" AND socialId = ?',
                    [userInfo.id]
                );

                if (user) {
                    const token = jwt.sign(
                        { id: user.id },
                        process.env.JWT_SECRET,
                        { expiresIn: '1h' }
                    );
                    return { user, token };
                }

                // 새 사용자 생성
                const [result] = await connection.query(`
                    INSERT INTO auth (
                        username, email, name, provider, socialId, 
                        password, status, lastPasswordChange
                    ) VALUES (?, ?, ?, 'naver', ?, ?, 'active', NOW())
                `, [
                    `naver_${userInfo.id}`,
                    userInfo.email,
                    userInfo.name,
                    userInfo.id,
                    await bcrypt.hash(Math.random().toString(36), 12)
                ]);

                const [newUser] = await connection.query(
                    'SELECT * FROM auth WHERE id = ?',
                    [result.insertId]
                );

                const token = jwt.sign(
                    { id: newUser.id },
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' }
                );

                return { user: newUser, token };
            } catch (error) {
                throw new Error('네이버 로그인 처리 실패: ' + error.message);
            }
        });
    },

    // 카카오 로그인 처리
    async handleKakaoLogin(accessToken, userInfo) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 기존 사용자 확인
                const [user] = await connection.query(
                    'SELECT * FROM auth WHERE provider = "kakao" AND socialId = ?',
                    [userInfo.id]
                );

                if (user) {
                    const token = jwt.sign(
                        { id: user.id },
                        process.env.JWT_SECRET,
                        { expiresIn: '1h' }
                    );
                    return { user, token };
                }

                // 새 사용자 생성
                const [result] = await connection.query(`
                    INSERT INTO auth (
                        username, email, name, provider, socialId,
                        password, status, lastPasswordChange
                    ) VALUES (?, ?, ?, 'kakao', ?, ?, 'active', NOW())
                `, [
                    `kakao_${userInfo.id}`,
                    userInfo.email,
                    userInfo.name,
                    userInfo.id,
                    await bcrypt.hash(Math.random().toString(36), 12)
                ]);

                const [newUser] = await connection.query(
                    'SELECT * FROM auth WHERE id = ?',
                    [result.insertId]
                );

                const token = jwt.sign(
                    { id: newUser.id },
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' }
                );

                return { user: newUser, token };
            } catch (error) {
                throw new Error('카카오 로그인 처리 실패: ' + error.message);
            }
        });
    },

    // 토큰 검증
    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const [user] = await dbUtils.query(
                'SELECT * FROM auth WHERE id = ? AND status = "active"',
                [decoded.id]
            );

            if (!user) {
                throw new Error('유효하지 않은 토큰입니다.');
            }

            delete user.password;
            delete user.refreshToken;
            return user;
        } catch (error) {
            throw new Error('토큰 검증 실패: ' + error.message);
        }
    },

    // 토큰 갱신
    async refreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const [user] = await dbUtils.query(
                'SELECT * FROM auth WHERE id = ? AND refreshToken = ?',
                [decoded.id, refreshToken]
            );

            if (!user) {
                throw new Error('유효하지 않은 갱신 토큰입니다.');
            }

            const newAccessToken = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            const newRefreshToken = jwt.sign(
                { id: user.id },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: '7d' }
            );

            await dbUtils.query(
                'UPDATE auth SET refreshToken = ? WHERE id = ?',
                [newRefreshToken, user.id]
            );

            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            };
        } catch (error) {
            throw new Error('토큰 갱신 실패: ' + error.message);
        }
    },

    // 아이디 중복 확인
    async checkUsernameExists(username) {
        try {
            const [user] = await dbUtils.query(
                'SELECT id FROM auth WHERE username = ?',
                [username]
            );
            return !!user;
        } catch (error) {
            throw new Error('아이디 중복 확인 실패: ' + error.message);
        }
    }
};

module.exports = authService;