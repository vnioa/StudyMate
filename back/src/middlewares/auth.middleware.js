const jwt = require('jsonwebtoken');

// 인증 미들웨어
const authenticateToken = async (req, res, next) => {
    try {
        // Authorization 헤더에서 토큰 추출
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: '인증 토큰이 필요합니다.'
            });
        }

        // 토큰 검증
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: '유효하지 않은 토큰입니다.'
                });
            }
            req.user = user;
            next();
        });
    } catch (error) {
        console.error('인증 미들웨어 오류:', error);
        res.status(500).json({
            success: false,
            message: '인증 처리 중 오류가 발생했습니다.'
        });
    }
};

// 관리자 권한 확인 미들웨어
const isAdmin = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '관리자 권한이 필요합니다.'
            });
        }
        next();
    } catch (error) {
        console.error('권한 확인 오류:', error);
        res.status(500).json({
            success: false,
            message: '권한 확인 중 오류가 발생했습니다.'
        });
    }
};

// 리소스 소유자 확인 미들웨어
const isResourceOwner = async (req, res, next) => {
    try {
        const resourceId = req.params.id;
        const userId = req.user.id;

        if (resourceId !== userId) {
            return res.status(403).json({
                success: false,
                message: '해당 리소스에 대한 권한이 없습니다.'
            });
        }
        next();
    } catch (error) {
        console.error('리소스 소유자 확인 오류:', error);
        res.status(500).json({
            success: false,
            message: '리소스 소유자 확인 중 오류가 발생했습니다.'
        });
    }
};

module.exports = {
    authenticateToken,
    isAdmin,
    isResourceOwner
};