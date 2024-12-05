const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const logger = require('../utils/logger.util');
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

// 토큰 검증 함수
const verifyToken = async (token, secret) => {
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        throw error;
    }
};

// 토큰 생성 함수
const generateToken = (payload, secret, options) => {
    return jwt.sign(payload, secret, options);
};

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
    }
};

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            throw createError(401, '인증 헤더가 없습니다.');
        }

        const [bearer, token] = authHeader.split(' ');

        if (bearer !== 'Bearer' || !token) {
            throw createError(401, '잘못된 인증 형식입니다.');
        }

        const decoded = await verifyToken(token, process.env.JWT_SECRET);
        req.user = decoded;

        // 토큰 만료 임박 확인 (예: 5분 이내)
        const tokenExp = decoded.exp * 1000;
        const now = Date.now();
        if (tokenExp - now < 300000) {
            res.set('X-Token-Expiring', 'true');
        }

        next();
    } catch (error) {
        logger.error('Token authentication error:', { error: error.message });

        if (error.name === 'TokenExpiredError') {
            next(createError(401, '토큰이 만료되었습니다.'));
        } else if (error.name === 'JsonWebTokenError') {
            next(createError(401, '유효하지 않은 토큰입니다.'));
        } else {
            next(error);
        }
    }
};

const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            throw createError(401, 'Refresh 토큰이 필요합니다.');
        }

        const decoded = await verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);

        const accessToken = generateToken(
            {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // 새로운 Refresh 토큰 발급
        const newRefreshToken = generateToken(
            { id: decoded.id, email: decoded.email },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
        );

        // 쿠키 옵션
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
        };

        res.cookie('refreshToken', newRefreshToken, cookieOptions);
        res.json({ accessToken });

    } catch (error) {
        logger.error('Token refresh error:', { error: error.message });

        if (error.name === 'TokenExpiredError') {
            next(createError(401, 'Refresh 토큰이 만료되었습니다. 다시 로그인해주세요.'));
        } else {
            next(error);
        }
    }
};

const checkRole = (roles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw createError(401, '인증이 필요합니다.');
            }

            if (!Array.isArray(roles)) {
                roles = [roles];
            }

            if (!roles.includes(req.user.role)) {
                logger.warn('Unauthorized role access attempt:', {
                    userId: req.user.id,
                    requiredRoles: roles,
                    userRole: req.user.role
                });
                throw createError(403, '접근 권한이 없습니다.');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    ...auth,
    authenticateToken,
    refreshToken,
    checkRole,
    verifyToken,
    generateToken
};