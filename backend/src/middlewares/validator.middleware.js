const createError = require('http-errors');
const { validationResult } = require('express-validator');

// 유효성 검사 결과 처리 미들웨어
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(createError(400, {
            success: false,
            message: '입력값이 올바르지 않습니다.',
            errors: errors.array()
        }));
    }
    next();
};

// 사용자 입력 데이터 정제
const sanitizeInput = (req, res, next) => {
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }
        });
    }
    next();
};

// 필수 필드 검사
const requireFields = (fields) => {
    return (req, res, next) => {
        const missingFields = fields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return next(createError(400, {
                success: false,
                message: '필수 입력값이 누락되었습니다.',
                missingFields
            }));
        }
        next();
    };
};

// 파일 유효성 검사
const validateFile = (allowedTypes, maxSize) => {
    return (req, res, next) => {
        if (!req.file) {
            return next();
        }

        const fileType = req.file.mimetype;
        const fileSize = req.file.size;

        if (!allowedTypes.includes(fileType)) {
            return next(createError(400, '지원하지 않는 파일 형식입니다.'));
        }

        if (fileSize > maxSize) {
            return next(createError(400, '파일 크기가 너무 큽니다.'));
        }

        next();
    };
};

// ID 파라미터 검증
const validateId = (paramName) => {
    return (req, res, next) => {
        const id = req.params[paramName];
        if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
            return next(createError(400, '유효하지 않은 ID입니다.'));
        }
        next();
    };
};

module.exports = {
    validate,
    sanitizeInput,
    requireFields,
    validateFile,
    validateId
};