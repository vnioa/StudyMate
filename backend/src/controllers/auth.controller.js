const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/mysql');
const { sendEmail } = require('../utils/email');
const createError = require('http-errors');

const AuthController = {
    // 인증 코드 발송
    sendAuthCode: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { name, email, type, userId } = req.body;
            const authCode = Math.random().toString(36).slice(-6).toUpperCase();

            await connection.query(
                'INSERT INTO auth_codes (email, code, type, expires_at) VALUES (?, ?, ?, ?)',
                [email, authCode, type, new Date(Date.now() + 30 * 60 * 1000)]
            );

            await sendEmail(email, '인증 코드', `인증 코드: ${authCode}`);

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 인증 코드 확인
    verifyAuthCode: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { email, authCode, type } = req.body;

            const [rows] = await connection.query(
                'SELECT * FROM auth_codes WHERE email = ? AND code = ? AND type = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
                [email, authCode, type]
            );

            if (!rows.length) {
                throw createError(400, '유효하지 않은 인증 코드입니다.');
            }

            await connection.query('DELETE FROM auth_codes WHERE id = ?', [rows[0].id]);

            const response = { success: true };
            if (type === 'id') {
                const [user] = await connection.query('SELECT user_id FROM users WHERE email = ?', [email]);
                response.userId = user[0]?.user_id;
            }

            res.json(response);
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 로그인
    login: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { userId, password } = req.body;

            const [user] = await connection.query(
                'SELECT * FROM users WHERE user_id = ?',
                [userId]
            );

            if (!user.length || !await bcrypt.compare(password, user[0].password)) {
                throw createError(401, '아이디 또는 비밀번호가 일치하지 않습니다.');
            }

            const accessToken = jwt.sign(
                { id: user[0].id },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            const refreshToken = jwt.sign(
                { id: user[0].id },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: '7d' }
            );

            await connection.query(
                'UPDATE users SET refresh_token = ? WHERE id = ?',
                [refreshToken, user[0].id]
            );

            res.json({
                accessToken,
                refreshToken,
                user: {
                    id: user[0].id,
                    userId: user[0].user_id,
                    name: user[0].name,
                    email: user[0].email
                }
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 로그아웃
    logout: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            await connection.query(
                'UPDATE users SET refresh_token = NULL WHERE id = ?',
                [req.user.id]
            );

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 비밀번호 재설정
    resetPassword: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { email, userId, newPassword } = req.body;

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            const result = await connection.query(
                'UPDATE users SET password = ? WHERE email = ? AND user_id = ?',
                [hashedPassword, email, userId]
            );

            if (result.affectedRows === 0) {
                throw createError(404, '사용자를 찾을 수 없습니다.');
            }

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 소셜 로그인 (구글)
    googleLogin: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { accessToken, userInfo } = req.body;

            let [user] = await connection.query(
                'SELECT * FROM users WHERE google_id = ?',
                [userInfo.id]
            );

            if (!user.length) {
                // 새 사용자 등록
                const result = await connection.query(
                    'INSERT INTO users (google_id, email, name, profile_image) VALUES (?, ?, ?, ?)',
                    [userInfo.id, userInfo.email, userInfo.name, userInfo.profileImage]
                );
                [user] = await connection.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
            }

            const token = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET, { expiresIn: '1d' });
            const refreshToken = jwt.sign({ id: user[0].id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

            res.json({
                success: true,
                data: {
                    token,
                    refreshToken,
                    user: user[0]
                }
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 소셜 로그인 (카카오)
    kakaoLogin: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { accessToken, userInfo } = req.body;

            let [user] = await connection.query(
                'SELECT * FROM users WHERE kakao_id = ?',
                [userInfo.id]
            );

            if (!user.length) {
                const result = await connection.query(
                    'INSERT INTO users (kakao_id, email, name, profile_image) VALUES (?, ?, ?, ?)',
                    [userInfo.id, userInfo.email, userInfo.name, userInfo.profileImage]
                );
                [user] = await connection.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
            }

            const token = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET, { expiresIn: '1d' });
            const refreshToken = jwt.sign({ id: user[0].id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

            res.json({
                success: true,
                data: {
                    token,
                    refreshToken,
                    user: user[0]
                }
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 로그인 상태 확인
    checkLoginStatus: async (req, res, next) => {
        try {
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    },

    // 토큰 갱신
    refresh: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { refreshToken } = req.body;

            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

            const [user] = await connection.query(
                'SELECT * FROM users WHERE id = ? AND refresh_token = ?',
                [decoded.id, refreshToken]
            );

            if (!user.length) {
                throw createError(401, '유효하지 않은 리프레시 토큰입니다.');
            }

            const accessToken = jwt.sign(
                { id: user[0].id },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            res.json({ accessToken });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 회원가입
    register: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { username, password, name, birthdate, phoneNumber, email } = req.body;

            const hashedPassword = await bcrypt.hash(password, 10);

            const result = await connection.query(
                'INSERT INTO users (user_id, password, name, birthdate, phone_number, email) VALUES (?, ?, ?, ?, ?, ?)',
                [username, hashedPassword, name, birthdate, phoneNumber, email]
            );

            const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, { expiresIn: '1d' });
            const refreshToken = jwt.sign({ id: result.insertId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

            res.json({
                success: true,
                data: {
                    token,
                    refreshToken,
                    user: {
                        id: result.insertId,
                        userId: username,
                        name,
                        email
                    }
                }
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 아이디 중복 확인
    checkUsername: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { username } = req.params;

            const [user] = await connection.query(
                'SELECT id FROM users WHERE user_id = ?',
                [username]
            );

            res.json({ available: user.length === 0 });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    }
};

module.exports = AuthController;