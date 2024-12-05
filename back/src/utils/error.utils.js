// 커스텀 에러 클래스 정의
class CustomError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
        Error.captureStackTrace(this, this.constructor);
    }
}

// 에러 타입 정의
const ERROR_TYPES = {
    VALIDATION_ERROR: 'ValidationError',
    AUTHENTICATION_ERROR: 'AuthenticationError',
    AUTHORIZATION_ERROR: 'AuthorizationError',
    NOT_FOUND_ERROR: 'NotFoundError',
    DATABASE_ERROR: 'DatabaseError',
    NETWORK_ERROR: 'NetworkError',
    BUSINESS_ERROR: 'BusinessError'
};

// 에러 상태 코드 정의
const ERROR_STATUS = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER: 500
};

// 에러 메시지 포맷팅
const formatErrorMessage = (error) => {
    return {
        success: false,
        message: error.message,
        status: error.status || 500,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
};

// 데이터베이스 에러 처리
const handleDatabaseError = (error) => {
    const customError = new CustomError(
        '데이터베이스 작업 중 오류가 발생했습니다.',
        ERROR_STATUS.INTERNAL_SERVER
    );
    customError.originalError = error;
    return customError;
};

// 유효성 검사 에러 처리
const handleValidationError = (errors) => {
    const messages = Object.values(errors).map(err => err.message);
    return new CustomError(
        messages.join(', '),
        ERROR_STATUS.BAD_REQUEST
    );
};

// 인증 에러 처리
const handleAuthError = (message = '인증에 실패했습니다.') => {
    return new CustomError(message, ERROR_STATUS.UNAUTHORIZED);
};

// 권한 에러 처리
const handlePermissionError = (message = '권한이 없습니다.') => {
    return new CustomError(message, ERROR_STATUS.FORBIDDEN);
};

// 리소스를 찾을 수 없는 경우의 에러 처리
const handleNotFoundError = (resource = '리소스') => {
    return new CustomError(
        `${resource}를 찾을 수 없습니다.`,
        ERROR_STATUS.NOT_FOUND
    );
};

module.exports = {
    CustomError,
    ERROR_TYPES,
    ERROR_STATUS,
    formatErrorMessage,
    handleDatabaseError,
    handleValidationError,
    handleAuthError,
    handlePermissionError,
    handleNotFoundError
};