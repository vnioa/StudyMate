const createError = require('http-errors');
const { validationResult } = require('express-validator');

// 유효성 검사 결과 처리 미들웨어
const validate = (req, res, next) => {
    try{
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return next(createError(400, {
                success: false,
                message: '입력값이 올바르지 않습니다.',
                errors: errors.array()
            }));
        }
        next();
    } catch (error) {
        next(createError(500, '유효성 검사 중 오류가 발생했습니다.'));
    }
};

// 사용자 입력 데이터 정제
const sanitizeInput = (req, res, next) => {
    try {
        if (req.body) {
            Object.keys(req.body).forEach(key => {
                if (typeof req.body[key] === 'string') {
                    // XSS 방지를 위한 특수문자 이스케이프 처리 추가
                    req.body[key] = req.body[key]
                        .trim()
                        .replace(/[<>]/g, '');
                }
            });
        }
        next();
    } catch (error) {
        next(createError(500, '입력 데이터 정제 중 오류가 발생했습니다.'));
    }
};

// 필수 필드 검사
const requireFields = (fields) => {
    return (req, res, next) => {
        try {
            const missingFields = fields.filter(field => {
                const value = req.body[field];
                return value === undefined || value === null || value === '';
            });

            if (missingFields.length > 0) {
                return next(createError(400, {
                    success: false,
                    message: '필수 입력값이 누락되었습니다.',
                    missingFields,
                    requiredFields: fields
                }));
            }
            next();
        } catch (error) {
            next(createError(500, '필수 필드 검사 중 오류가 발생했습니다.'));
        }
    };
};

// 파일 유효성 검사
const validateFile = (allowedTypes, maxSize) => {
    return (req, res, next) => {
        try {
            if (!req.file) {
                return next();
            }

            const fileType = req.file.mimetype;
            const fileSize = req.file.size;

            if (!allowedTypes.includes(fileType)) {
                return next(createError(400, {
                    success: false,
                    message: '지원하지 않는 파일 형식입니다.',
                    allowedTypes
                }));
            }

            if (fileSize > maxSize) {
                return next(createError(400, {
                    success: false,
                    message: '파일 크기가 너무 큽니다.',
                    maxSize: `${maxSize / (1024 * 1024)}MB`
                }));
            }

            next();
        } catch (error) {
            next(createError(500, '파일 검증 중 오류가 발생했습니다.'));
        }
    };
};

// ID 파라미터 검증
const validateId = (paramName) => {
    return (req, res, next) => {
        try {
            const id = req.params[paramName];
            const numId = Number(id);

            if (!id || !Number.isInteger(numId) || numId <= 0) {
                return next(createError(400, {
                    success: false,
                    message: '유효하지 않은 ID입니다.',
                    param: paramName,
                    value: id
                }));
            }

            // 검증된 숫자 ID를 req 객체에 저장
            req.validatedId = numId;
            next();
        } catch (error) {
            next(createError(500, 'ID 검증 중 오류가 발생했습니다.'));
        }
    };
};

module.exports = {
    validate,
    sanitizeInput,
    requireFields,
    validateFile,
    validateId
};