const jwt = require('jsonwebtoken');
const db = require('../config/mysql');

const auth = async (req, res, next) => {
    try {
        // Authorization 헤더에서 토큰 추출
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: '인증 토큰이 필요합니다.'
            });
        }

        // 토큰 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 세션 확인
        const [session] = await db.execute(
            'SELECT * FROM sessions WHERE user_id = ? AND token = ?',
            [decoded.id, token]
        );

        if (session.length === 0) {
            throw new Error('세션이 만료되었습니다.');
        }

        // 사용자 정보 조회
        const [user] = await db.execute(
            'SELECT id, username, name, email FROM users WHERE id = ?',
            [decoded.id]
        );

        if (user.length === 0) {
            throw new Error('사용자를 찾을 수 없습니다.');
        }

        // request 객체에 사용자 정보와 토큰 추가
        req.user = user[0];
        req.token = token;

        next();
    } catch (error) {
        console.error('인증 미들웨어 오류:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: '유효하지 않은 토큰입니다.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '토큰이 만료되었습니다.'
            });
        }

        res.status(401).json({
            success: false,
            message: '인증에 실패했습니다.'
        });
    }
};

module.exports = auth;