const db = require('../config/db');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// 인증 코드 발송
const sendAuthCode = async (req, res) => {
    const { email } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    console.log(`이메일 인증 코드 전송 요청: ${email}, 코드: ${code}`);

    try {
        // 이메일 발송
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
            to: email,
            subject: 'StudyMate 인증 코드',
            text: `인증 코드: ${code}`,
        });

        // 인증 코드 저장
        await db.execute(
            `INSERT INTO verification_codes (email, code, expires_at) 
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
             ON DUPLICATE KEY UPDATE code = ?, expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)`,
            [email, code, code]
        );
        console.log('인증 코드 DB 저장 완료');

        res.status(200).json({ success: true, message: '인증 코드가 발송되었습니다.', code });
    } catch (error) {
        console.error('인증 코드 발송 오류:', error);
        res.status(500).json({ success: false, message: '이메일 전송에 실패했습니다.' });
    }
};

// 인증 코드 확인
const verifyAuthCode = async (req, res) => {
    const { email, authCode, type } = req.body;
    try {
        const [result] = await db.execute(
            `SELECT * FROM verification_codes WHERE email = ? AND code = ? AND expires_at > NOW()`,
            [email, authCode]
        );

        if (result.length === 0) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 인증 코드입니다.'
            });
        }

        if (type === 'id') {
            // 이메일로 사용자 찾기
            const [user] = await db.execute(
                'SELECT username FROM users WHERE email = ?',
                [email]
            );

            if (user.length > 0) {
                return res.status(200).json({
                    success: true,
                    message: '인증 코드가 유효합니다.',
                    userId: user[0].username
                });
            }
        }

        res.status(200).json({
            success: true,
            message: '인증 코드가 유효합니다.'
        });
    } catch (error) {
        console.error('인증 코드 확인 오류:', error);
        res.status(500).json({
            success: false,
            message: '인증 코드 확인에 실패했습니다.'
        });
    }
};

const login = async (req, res) => {
    const { userId, password } = req.body;

    // 필수 파라미터 검증
    if (!userId || !password) {
        return res.status(400).json({
            success: false,
            message: '아이디와 비밀번호를 모두 입력해주세요.'
        });
    }

    try {
        const [user] = await db.execute(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [userId, userId]
        );

        if (user.length === 0) {
            return res.status(401).json({
                success: false,
                message: '아이디 또는 비밀번호가 잘못되었습니다.'
            });
        }

        const isValidPassword = await bcrypt.compare(password, user[0].password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: '아이디 또는 비밀번호가 잘못되었습니다.'
            });
        }

        const accessToken = jwt.sign(
            { id: user[0].user_id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            accessToken,
            user: {
                username: user[0].username,
                email: user[0].email,
                name: user[0].name,
                phone_number: user[0].phone_number,
            },
        });
    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({
            success: false,
            message: '로그인에 실패했습니다.'
        });
    }
};const login = async (req, res) => {
    const { userId, password } = req.body;

    try {
        // 사용자 조회
        const [user] = await db.execute(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [userId, userId]
        );

        if (user.length === 0) {
            return res.status(401).json({
                success: false,
                message: '아이디 또는 비밀번호가 잘못되었습니다.'
            });
        }

        // 비밀번호 검증
        const isValidPassword = await bcrypt.compare(password, user[0].password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: '아이디 또는 비밀번호가 잘못되었습니다.'
            });
        }

        // JWT 토큰 생성
        const accessToken = jwt.sign(
            { id: user[0].user_id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 응답
        res.status(200).json({
            success: true,
            accessToken,
            user: {
                username: user[0].username,
                email: user[0].email,
                name: user[0].name,
                phone_number: user[0].phone_number
            }
        });
    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({
            success: false,
            message: '로그인에 실패했습니다.'
        });
    }
};

// API 요청 인증 미들웨어
const authenticateToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: '인증이 필요합니다.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [user] = await db.execute(
            'SELECT * FROM users WHERE user_id = ?',
            [decoded.id]
        );

        if (user.length === 0) {
            return res.status(401).json({
                success: false,
                message: '유효하지 않은 사용자입니다.'
            });
        }

        req.user = user[0];
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: '유효하지 않은 토큰입니다.'
        });
    }
};

// 로그아웃
const logout = async (req, res) => {
    try {
        res.status(200).json({ success: true, message: '로그아웃되었습니다.' });
    } catch (error) {
        console.error('로그아웃 오류:', error);
        res.status(500).json({ success: false, message: '로그아웃에 실패했습니다.' });
    }
};

// 비밀번호 재설정
const resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        const [user] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (user.length === 0) {
            return res.status(404).json({ success: false, message: '해당 이메일로 등록된 사용자가 없습니다.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.execute('UPDATE users SET password_hash = ? WHERE email = ?', [hashedPassword, email]);

        res.status(200).json({ success: true, message: '비밀번호가 성공적으로 재설정되었습니다.' });
    } catch (error) {
        console.error('비밀번호 재설정 오류:', error);
        res.status(500).json({ success: false, message: '비밀번호 재설정에 실패했습니다.' });
    }
};

// 회원가입
const register = async (req, res) => {
    const { username, password, name, birthdate, phoneNumber, email } = req.body;

    try {
        const [existingUser] = await db.execute(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: '이미 존재하는 사용자입니다.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // SQL 쿼리의 컬럼명 수정
        const [result] = await db.execute(
            `INSERT INTO users 
            (username, password_hash, name, phone_number, birth_date, email) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [username, hashedPassword, name, phoneNumber, birthdate, email]
        );

        if (result.affectedRows > 0) {
            res.status(201).json({
                success: true,
                message: '회원가입이 완료되었습니다.'
            });
        } else {
            throw new Error('데이터베이스 삽입 실패');
        }
    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({
            success: false,
            message: '회원가입에 실패했습니다.'
        });
    }
};

// 아이디 중복 확인
const checkUsername = async (req, res) => {
    const { username } = req.body;
    console.log(`아이디 중복 확인 요청: ${username}`);

    try {
        const [existingUser] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        console.log(`DB 조회 결과: ${existingUser.length > 0 ? '아이디 존재' : '아이디 사용 가능'}`);

        const available = existingUser.length === 0;
        const message = available ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.';

        res.status(200).json({
            available,
            message
        });
    } catch (error) {
        console.error('아이디 중복 확인 오류:', error);
        res.status(500).json({
            available: false,
            message: '아이디 중복 확인에 실패했습니다.'
        });
    }
};

// 토큰 갱신
const refresh = async (req, res) => {
    const { refreshToken } = req.body;

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({ success: true, accessToken: newAccessToken });
    } catch (error) {
        console.error('토큰 갱신 오류:', error);
        res.status(401).json({ success: false, message: '토큰 갱신에 실패했습니다.' });
    }
};

// 구글 로그인
const googleLogin = async (req, res) => {
    const { accessToken, userInfo } = req.body;

    try {
        // Google 유저 ID로 기존 계정 확인
        const [existingUser] = await db.execute("SELECT * FROM users WHERE email = ? AND role = 'user'", [
            userInfo.email,
        ]);

        let user;
        if (existingUser.length > 0) {
            user = existingUser[0];
        } else {
            // 새로운 사용자 생성
            await db.execute(
                `INSERT INTO users (username, email, name, profile_image, role) 
                 VALUES (?, ?, ?, ?, 'user')`,
                [`google_${userInfo.id}`, userInfo.email, userInfo.name, userInfo.profileImage]
            );

            const [newUser] = await db.execute('SELECT * FROM users WHERE email = ?', [userInfo.email]);
            user = newUser[0];
        }

        // JWT 토큰 생성
        const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            success: true,
            message: '구글 로그인에 성공했습니다.',
            data: {
                token,
                user: {
                    id: user.user_id,
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    profileImage: user.profile_image,
                },
            },
        });
    } catch (error) {
        console.error('구글 로그인 오류:', error);
        res.status(500).json({ success: false, message: '구글 로그인에 실패했습니다.' });
    }
};

// 카카오 로그인
const kakaoLogin = async (req, res) => {
    const { accessToken, userInfo } = req.body;

    try {
        // Kakao 유저 ID로 기존 계정 확인
        const [existingUser] = await db.execute("SELECT * FROM users WHERE email = ? AND role = 'user'", [
            userInfo.email,
        ]);

        let user;
        if (existingUser.length > 0) {
            user = existingUser[0];
        } else {
            // 새로운 사용자 생성
            await db.execute(
                `INSERT INTO users (username, email, name, profile_image, role) 
                 VALUES (?, ?, ?, ?, 'user')`,
                [`kakao_${userInfo.id}`, userInfo.email, userInfo.name, userInfo.profileImage]
            );

            const [newUser] = await db.execute('SELECT * FROM users WHERE email = ?', [userInfo.email]);
            user = newUser[0];
        }

        // JWT 토큰 생성
        const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            success: true,
            message: '카카오 로그인에 성공했습니다.',
            data: {
                token,
                user: {
                    id: user.user_id,
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    profileImage: user.profile_image,
                },
            },
        });
    } catch (error) {
        console.error('카카오 로그인 오류:', error);
        res.status(500).json({ success: false, message: '카카오 로그인에 실패했습니다.' });
    }
};

// 로그인 상태 확인
const checkLoginStatus = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: '토큰이 제공되지 않았습니다.' });
    }

    try {
        // 토큰 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 유저 확인
        const [user] = await db.execute('SELECT * FROM users WHERE user_id = ?', [decoded.id]);

        if (user.length === 0) {
            return res.status(401).json({ success: false, message: '유효하지 않은 사용자입니다.' });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user[0].user_id,
                username: user[0].username,
                email: user[0].email,
                name: user[0].name,
                profileImage: user[0].profile_image,
            },
        });
    } catch (error) {
        console.error('로그인 상태 확인 오류:', error);
        res.status(401).json({ success: false, message: '토큰이 유효하지 않습니다.' });
    }
};

module.exports = {
    sendAuthCode,
    verifyAuthCode,
    login,
    logout,
    resetPassword,
    register,
    checkUsername,
    refresh,
    googleLogin,
    kakaoLogin,
    checkLoginStatus,
    authenticateToken
};
