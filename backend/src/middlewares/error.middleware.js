const createError = require('http-errors');
const logger = require('../utils/logger.util');
const { errorResponse } = require('../utils/response.util');

// 에러 타입 정의
const ERROR_TYPES = {
    ValidationError: {
        status: 400,
        message: '입력값이 올바르지 않습니다.'
    },
    UnauthorizedError: {
        status: 401,
        message: '인증이 필요합니다.'
    },
    TokenExpiredError: {
        status: 401,
        message: '토큰이 만료되었습니다.'
    },
    JsonWebTokenError: {
        status: 401,
        message: '유효하지 않은 토큰입니다.'
    },
    ForbiddenError: {
        status: 403,
        message: '접근 권한이 없습니다.'
    },
    NotFoundError: {
        status: 404,
        message: '요청하신 리소스를 찾을 수 없습니다.'
    },
    ConflictError: {
        status: 409,
        message: '리소스 충돌이 발생했습니다.'
    }
};

// 데이터베이스 에러 타입 정의
const DB_ERROR_TYPES = {
    ER_DUP_ENTRY: {
        status: 409,
        message: '중복된 데이터가 존재합니다.'
    },
    ER_NO_REFERENCED_ROW: {
        status: 400,
        message: '참조된 데이터가 존재하지 않습니다.'
    },
    ER_ROW_IS_REFERENCED: {
        status: 400,
        message: '다른 데이터에서 참조중인 데이터입니다.'
    },
    ER_NO_DEFAULT_FOR_FIELD: {
        status: 400,
        message: '필수 필드가 누락되었습니다.'
    },
    ER_DATA_TOO_LONG: {
        status: 400,
        message: '데이터가 너무 깁니다.'
    }
};

// 에러 상세 정보 수집
const getErrorDetails = (err) => {
    return {
        name: err.name,
        code: err.code,
        status: err.status,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        details: err.details || undefined,
        errors: err.errors || undefined
    };
};

// 에러 메트릭 수집
const collectErrorMetrics = (err, req) => {
    return {
        errorType: err.name,
        status: err.status,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
        userId: req.user?.id || 'anonymous',
        requestId: req.requestId
    };
};

// 메인 에러 핸들러
const errorHandler = (err, req, res, next) => {
    try {
        // 에러 정보 수집
        const errorDetails = getErrorDetails(err);
        const errorMetrics = collectErrorMetrics(err, req);

        // 에러 로깅
        logger.error('Error occurred:', {
            ...errorMetrics,
            error: errorDetails
        });

        // 기본 에러 응답 객체 생성
        let errorObj = {
            success: false,
            status: err.status || 500,
            message: err.message || '서버 내부 오류가 발생했습니다.',
            requestId: req.requestId
        };

        // 개발 환경에서 추가 정보 포함
        if (process.env.NODE_ENV === 'development') {
            errorObj.details = errorDetails;
        }

        // 에러 타입별 처리
        if (ERROR_TYPES[err.name]) {
            const { status, message } = ERROR_TYPES[err.name];
            errorObj.status = status;
            errorObj.message = message;
        }

        // 데이터베이스 에러 처리
        if (DB_ERROR_TYPES[err.code]) {
            const { status, message } = DB_ERROR_TYPES[err.code];
            errorObj.status = status;
            errorObj.message = message;
        }

        // Sequelize 유효성 검사 에러 처리
        if (err.name === 'SequelizeValidationError') {
            errorObj.status = 400;
            errorObj.message = '데이터 유효성 검사에 실패했습니다.';
            errorObj.errors = err.errors.map(e => ({
                field: e.path,
                message: e.message
            }));
        }

        // 파일 업로드 에러 처리
        if (err.code === 'LIMIT_FILE_SIZE') {
            errorObj.status = 400;
            errorObj.message = '파일 크기가 제한을 초과했습니다.';
        }

        // 프로덕션 환경에서 에러 모니터링
        if (process.env.NODE_ENV === 'production') {
            // 여기에 모니터링 시스템 연동 코드 구현
            // 예: Sentry, NewRelic 등
        }

        // 에러 응답 전송
        res.status(errorObj.status).json(errorResponse(errorObj.message, errorObj));

    } catch (error) {
        // 에러 핸들러 자체에서 발생한 에러 처리
        logger.error('Error in error handler:', error);
        res.status(500).json(errorResponse('서버 내부 오류가 발생했습니다.'));
    }
};

module.exports = errorHandler;