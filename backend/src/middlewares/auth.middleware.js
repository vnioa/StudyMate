const jwt = require('jsonwebtoken');
const createError = require('http-errors');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            throw createError(401, '인증 토큰이 필요합니다.');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
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
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            throw createError(401, 'Refresh 토큰이 필요합니다.');
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // 새로운 액세스 토큰 발급
        const accessToken = jwt.sign(
            { id: decoded.id, email: decoded.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({ accessToken });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            next(createError(401, 'Refresh 토큰이 만료되었습니다. 다시 로그인해주세요.'));
        } else {
            next(error);
        }
    }
};

const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(createError(401, '인증이 필요합니다.'));
        }

        if (!roles.includes(req.user.role)) {
            return next(createError(403, '접근 권한이 없습니다.'));
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    refreshToken,
    checkRole
};