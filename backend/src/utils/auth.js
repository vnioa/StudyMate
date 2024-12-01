const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

// 환경 변수에서 설정 가져오기
const {
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    GOOGLE_CLIENT_ID,
    KAKAO_APP_KEY
} = process.env;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const auth = {
    // 인증 코드 생성
    generateAuthCode: () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    },

    // 비밀번호 해싱
    hashPassword: async (password) => {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    },

    // 비밀번호 검증
    verifyPassword: async (password, hashedPassword) => {
        return bcrypt.compare(password, hashedPassword);
    },

    // 액세스 토큰 생성
    generateAccessToken: (userId) => {
        return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
    },

    // 리프레시 토큰 생성
    generateRefreshToken: (userId) => {
        return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    },

    // 토큰 검증
    verifyToken: (token, isRefreshToken = false) => {
        try {
            return jwt.verify(token, isRefreshToken ? JWT_REFRESH_SECRET : JWT_SECRET);
        } catch (error) {
            return null;
        }
    },

    // 구글 토큰 검증
    verifyGoogleToken: async (token) => {
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: GOOGLE_CLIENT_ID
            });
            return ticket.getPayload();
        } catch (error) {
            return null;
        }
    },

    // 카카오 토큰 검증
    verifyKakaoToken: async (token) => {
        try {
            const response = await axios.get('https://kapi.kakao.com/v1/user/access_token_info', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            return null;
        }
    },

    // 토큰에서 사용자 ID 추출
    extractUserIdFromToken: (token) => {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return decoded.userId;
        } catch (error) {
            return null;
        }
    },

    // 인증 미들웨어
    authenticateToken: (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: '인증 토큰이 필요합니다.'
            });
        }

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: '유효하지 않은 토큰입니다.'
                });
            }
            req.user = user;
            next();
        });
    }
};

module.exports = auth;