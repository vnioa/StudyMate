class CustomError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
        Error.captureStackTrace(this, this.constructor);
    }
}

const errorTypes = {
    BAD_REQUEST: { status: 400, message: '잘못된 요청입니다.' },
    UNAUTHORIZED: { status: 401, message: '인증이 필요합니다.' },
    FORBIDDEN: { status: 403, message: '권한이 없습니다.' },
    NOT_FOUND: { status: 404, message: '리소스를 찾을 수 없습니다.' },
    CONFLICT: { status: 409, message: '리소스가 이미 존재합니다.' },
    VALIDATION_ERROR: { status: 422, message: '유효성 검사에 실패했습니다.' },
    INTERNAL_SERVER_ERROR: { status: 500, message: '서버 내부 오류가 발생했습니다.' }
};

const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || '서버 내부 오류가 발생했습니다.';

    // 개발 환경에서만 스택 트레이스 포함
    const error = {
        success: false,
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };

    res.status(status).json(error);
};

module.exports = {
    CustomError,
    errorTypes,
    errorHandler
};