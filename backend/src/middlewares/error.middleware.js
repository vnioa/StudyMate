const createError = require('http-errors');

const errorHandler = (err, req, res, next) => {
    // 에러 로깅
    console.error(err);

    // 에러 응답 객체 생성
    const errorResponse = {
        success: false,
        status: err.status || 500,
        message: err.message || '서버 내부 오류가 발생했습니다.',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };

    // 특정 에러 타입에 따른 처리
    if (err.name === 'ValidationError') {
        errorResponse.status = 400;
        errorResponse.message = '입력값이 올바르지 않습니다.';
    } else if (err.name === 'UnauthorizedError') {
        errorResponse.status = 401;
        errorResponse.message = '인증이 필요합니다.';
    } else if (err.name === 'ForbiddenError') {
        errorResponse.status = 403;
        errorResponse.message = '접근 권한이 없습니다.';
    } else if (err.name === 'NotFoundError') {
        errorResponse.status = 404;
        errorResponse.message = '요청하신 리소스를 찾을 수 없습니다.';
    }

    // 데이터베이스 에러 처리
    if (err.code === 'ER_DUP_ENTRY') {
        errorResponse.status = 409;
        errorResponse.message = '중복된 데이터가 존재합니다.';
    }

    // 에러 응답 전송
    res.status(errorResponse.status).json(errorResponse);
};

module.exports = errorHandler;