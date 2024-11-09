const db = require('../config/db');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

// 구글 OAuth 클라이언트 초기화
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 이메일 인증 코드 생성 함수
const generateVerificationCode = () => {
    return Math.floor(1000000 + Math.random() * 9000000).toString();
};

// 아이디 중복 확인
const checkUsername = async (req, res) => {
    const { username } = req.body;
    console.log(`아이디 중복 확인 요청: ${username}`); // 로그 추가

    try {
        const [existingUser] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            return res.status(400).json({ available: false, message: '이미 사용 중인 아이디입니다.' });
        }
        res.status(200).json({ available: true });
    } catch (error) {
        console.error('아이디 중복 확인 오류:', error);
        res.status(500).json({ success: false, message: '아이디 중복 확인에 실패했습니다.' });
    }
};

// 이메일 인증 코드 전송
const sendVerificationCode = async (req, res) => {
    const { email } = req.body;
    const code = generateVerificationCode();
    console.log(`이메일 인증 코드 전송 요청: ${email}, 코드: ${code}`);

    let transporter = nodemailer.createTransport({
        host: 'smtp.naver.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.NAVER_EMAIL,
            pass: process.env.NAVER_PASSWORD,
        },
    });

    try {
        await transporter.sendMail({
            from: process.env.NAVER_EMAIL,
            to: email,
            subject: 'StudyMate 인증 코드',
            text: `인증 코드: ${code}`,
        });

        await db.execute('INSERT INTO verification_codes (email, code) VALUES (?, ?)', [email, code]);
        res.status(200).json({ success: true, code });
    } catch (error) {
        console.error('이메일 전송 오류:', error);
        res.status(500).json({ success: false, message: '이메일 전송에 실패했습니다.' });
    }
};

// 회원가입 처리 함수 (bcrypt로 비밀번호 해시화)
const registerUser = async (req, res) => {
    const { username, password, name, phoneNumber, birthdate, email } = req.body;

    try {
        const [existingUser] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: '이미 사용 중인 아이디입니다.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute(
            'INSERT INTO users (username, password, name, phoneNumber, birthdate, email) VALUES (?, ?, ?, ?, ?, ?)',
            [username, hashedPassword, name, phoneNumber, birthdate, email]
        );
        res.status(201).json({ success: true, message: '회원가입이 완료되었습니다.' });
    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({ success: false, message: '회원가입에 실패했습니다.' });
    }
};

// 로그인 처리 함수
const loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const [user] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (user.length === 0 || !(await bcrypt.compare(password, user[0].password))) {
            return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 잘못되었습니다.' });
        }

        const token = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        await db.execute('INSERT INTO sessions (user_id, token) VALUES (?, ?)', [user[0].id, token]);

        res.status(200).json({ success: true, token });
    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({ success: false, message: '로그인에 실패했습니다.' });
    }
};

// 구글 로그인 처리 함수
const googleLogin = async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name } = payload;

        let [user] = await db.execute('SELECT * FROM users WHERE google_id = ?', [googleId]);
        if (user.length === 0) {
            // 새로운 유저인 경우 회원가입 처리
            await db.execute('INSERT INTO users (google_id, email, name) VALUES (?, ?, ?)', [googleId, email, name]);
            [user] = await db.execute('SELECT * FROM users WHERE google_id = ?', [googleId]);
        }

        const token = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({ success: true, token });
    } catch (error) {
        console.error('구글 로그인 오류:', error);
        res.status(500).json({ success: false, message: '구글 로그인에 실패했습니다.' });
    }
};

// 네이버 로그인 처리 함수
const naverLogin = async (req, res) => {
    const { code } = req.body;

    try {
        const tokenResponse = await axios.post('https://nid.naver.com/oauth2.0/token', null, {
            params: {
                grant_type: 'authorization_code',
                client_id: process.env.NAVER_CLIENT_ID,
                client_secret: process.env.NAVER_CLIENT_SECRET,
                code,
            },
        });

        const accessToken = tokenResponse.data.access_token;
        const userInfoResponse = await axios.get('https://openapi.naver.com/v1/nid/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const { id: naverId, email, nickname: name } = userInfoResponse.data.response;

        let [user] = await db.execute('SELECT * FROM users WHERE naver_id = ?', [naverId]);
        if (user.length === 0) {
            await db.execute('INSERT INTO users (naver_id, email, name) VALUES (?, ?, ?)', [naverId, email, name]);
            [user] = await db.execute('SELECT * FROM users WHERE naver_id = ?', [naverId]);
        }

        const token = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({ success: true, token });
    } catch (error) {
        console.error('네이버 로그인 오류:', error);
        res.status(500).json({ success: false, message: '네이버 로그인에 실패했습니다.' });
    }
};

// 카카오 로그인 처리 함수
const kakaoLogin = async (req, res) => {
    const { code } = req.body;

    try {
        const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
            params: {
                grant_type: 'authorization_code',
                client_id: process.env.KAKAO_CLIENT_ID,
                redirect_uri: process.env.KAKAO_REDIRECT_URI,
                code,
            },
        });

        const accessToken = tokenResponse.data.access_token;
        const userInfoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const { id: kakaoId, kakao_account: { email, profile: { nickname: name } } } = userInfoResponse.data;

        let [user] = await db.execute('SELECT * FROM users WHERE kakao_id = ?', [kakaoId]);
        if (user.length === 0) {
            await db.execute('INSERT INTO users (kakao_id, email, name) VALUES (?, ?, ?)', [kakaoId, email, name]);
            [user] = await db.execute('SELECT * FROM users WHERE kakao_id = ?', [kakaoId]);
        }

        const token = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({ success: true, token });
    } catch (error) {
        console.error('카카오 로그인 오류:', error);
        res.status(500).json({ success: false, message: '카카오 로그인에 실패했습니다.' });
    }
};

// 토큰 검증 함수
const validateToken = async (req, res) => {
    const { token } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [session] = await db.execute('SELECT * FROM sessions WHERE user_id = ? AND token = ?', [decoded.id, token]);

        if (session.length === 0) {
            return res.status(401).json({ success: false, message: '세션이 유효하지 않습니다.' });
        }

        res.status(200).json({ success: true, message: '유효한 세션입니다.' });
    } catch (error) {
        console.error('토큰 검증 오류:', error);
        res.status(401).json({ success: false, message: '토큰 검증에 실패했습니다.' });
    }
};

// 아이디 찾기 함수
const findUserId = async (req, res) => {
    const { name, email } = req.body;

    try {
        const [user] = await db.execute('SELECT username FROM users WHERE name = ? AND email = ?', [name, email]);

        if (user.length === 0) {
            return res.status(404).json({ success: false, message: '해당 정보와 일치하는 아이디가 없습니다.' });
        }

        res.status(200).json({ success: true, username: user[0].username });
    } catch (error) {
        console.error('아이디 찾기 오류:', error);
        res.status(500).json({ success: false, message: '아이디 찾기에 실패했습니다.' });
    }
};

const resetPassword = async (req, res) => {
    const { username, email, code, newPassword } = req.body;

    if (!username || !email || !code || !newPassword) {
        return res.status(400).json({ success: false, message: '모든 필드를 올바르게 입력해 주세요.' });
    }

    try {
        const [user] = await db.execute('SELECT * FROM users WHERE username = ? AND email = ?', [username, email]);
        if (user.length === 0) {
            return res.status(404).json({ success: false, message: '해당 정보와 일치하는 계정이 없습니다.' });
        }

        const [validCode] = await db.execute('SELECT * FROM verification_codes WHERE user_id = ? AND code = ?', [user[0].id, code]);
        if (validCode.length === 0) {
            return res.status(400).json({ success: false, message: '인증 코드가 올바르지 않습니다.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user[0].id]);

        await db.execute('DELETE FROM verification_codes WHERE user_id = ?', [user[0].id]);

        res.status(200).json({ success: true, message: '비밀번호가 성공적으로 재설정되었습니다.' });
    } catch (error) {
        console.error('비밀번호 재설정 오류:', error);
        res.status(500).json({ success: false, message: '비밀번호 재설정에 실패했습니다.' });
    }
};

module.exports = {
    checkUsername,
    registerUser,
    sendVerificationCode,
    validateToken,
    loginUser,
    googleLogin,
    naverLogin,
    kakaoLogin,
    resetPassword,
    findUserId,
};
