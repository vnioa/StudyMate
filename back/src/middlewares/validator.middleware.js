const { CustomError } = require('../utils/error.utils');

// ID 유효성 검사 미들웨어
const validateId = (paramName) => {
    return (req, res, next) => {
        try {
            const id = req.params[paramName];

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: `${paramName} 파라미터가 필요합니다.`
                });
            }

            // ID가 유효한 숫자인지 확인
            if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: `유효하지 않은 ${paramName} 값입니다.`
                });
            }

            next();
        } catch (error) {
            console.error('ID 유효성 검사 오류:', error);
            next(new CustomError('ID 유효성 검사 중 오류가 발생했습니다.', 500));
        }
    };
};

// 필수 필드 검사 미들웨어
const requireFields = (fields) => {
    return (req, res, next) => {
        try {
            const missingFields = fields.filter(field => {
                const value = req.body[field];
                return value === undefined || value === null || value === '';
            });

            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `다음 필드가 필요합니다: ${missingFields.join(', ')}`
                });
            }

            next();
        } catch (error) {
            console.error('필드 유효성 검사 오류:', error);
            next(new CustomError('필드 유효성 검사 중 오류가 발생했습니다.', 500));
        }
    };
};

// 이메일 형식 검사 미들웨어
const validateEmail = (req, res, next) => {
    try {
        const { email } = req.body;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 이메일 형식입니다.'
            });
        }

        next();
    } catch (error) {
        console.error('이메일 유효성 검사 오류:', error);
        next(new CustomError('이메일 유효성 검사 중 오류가 발생했습니다.', 500));
    }
};

// 비밀번호 형식 검사 미들웨어
const validatePassword = (req, res, next) => {
    try {
        const { password } = req.body;

        // 최소 8자, 최대 20자
        // 최소 하나의 대문자, 소문자, 숫자, 특수문자 포함
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

        if (!password || !passwordRegex.test(password)) {
            return res.status(400).json({
                success: false,
                message: '비밀번호는 8-20자의 대소문자, 숫자, 특수문자를 포함해야 합니다.'
            });
        }

        next();
    } catch (error) {
        console.error('비밀번호 유효성 검사 오류:', error);
        next(new CustomError('비밀번호 유효성 검사 중 오류가 발생했습니다.', 500));
    }
};

// 파일 크기 검사 미들웨어
const validateFileSize = (maxSize) => {
    return (req, res, next) => {
        try {
            if (!req.file) {
                return next();
            }

            if (req.file.size > maxSize) {
                return res.status(400).json({
                    success: false,
                    message: `파일 크기는 ${maxSize / (1024 * 1024)}MB를 초과할 수 없습니다.`
                });
            }

            next();
        } catch (error) {
            console.error('파일 크기 검사 오류:', error);
            next(new CustomError('파일 크기 검사 중 오류가 발생했습니다.', 500));
        }
    };
};

// 파일 타입 검사 미들웨어
const validateFileType = (allowedTypes) => {
    return (req, res, next) => {
        try {
            if (!req.file) {
                return next();
            }

            const fileType = req.file.mimetype;
            if (!allowedTypes.includes(fileType)) {
                return res.status(400).json({
                    success: false,
                    message: `허용되지 않는 파일 형식입니다. 허용된 형식: ${allowedTypes.join(', ')}`
                });
            }

            next();
        } catch (error) {
            console.error('파일 타입 검사 오류:', error);
            next(new CustomError('파일 타입 검사 중 오류가 발생했습니다.', 500));
        }
    };
};

// 날짜 형식 검사 미들웨어
const validateDate = (dateField) => {
    return (req, res, next) => {
        try {
            const date = req.body[dateField];
            if (!date) {
                return next();
            }

            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(date) || isNaN(new Date(date).getTime())) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 날짜 형식입니다. (YYYY-MM-DD)'
                });
            }

            next();
        } catch (error) {
            console.error('날짜 유효성 검사 오류:', error);
            next(new CustomError('날짜 유효성 검사 중 오류가 발생했습니다.', 500));
        }
    };
};

module.exports = {
    validateId,
    requireFields,
    validateEmail,
    validatePassword,
    validateFileSize,
    validateFileType,
    validateDate
};