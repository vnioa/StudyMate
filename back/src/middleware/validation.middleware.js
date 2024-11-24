const { body, validationResult } = require('express-validator');

// 유효성 검사 결과 처리 미들웨어
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

// 회원가입 유효성 검사 규칙
const validateRegistration = [
    body('username')
        .trim()
        .isLength({ min: 4, max: 20 })
        .withMessage('아이디는 4~20자 사이여야 합니다.')
        .matches(/^[A-Za-z0-9]+$/)
        .withMessage('아이디는 영문자와 숫자만 사용 가능합니다.'),

    body('password')
        .isLength({ min: 8 })
        .withMessage('비밀번호는 최소 8자 이상이어야 합니다.')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/)
        .withMessage('비밀번호는 영문자, 숫자, 특수문자를 포함해야 합니다.'),

    body('email')
        .isEmail()
        .withMessage('유효한 이메일 주소를 입력해주세요.'),

    body('phoneNumber')
        .matches(/^01[016789]-?\d{3,4}-?\d{4}$/)
        .withMessage('유효한 전화번호 형식이 아닙니다.'),

    body('birthdate')
        .isDate()
        .withMessage('올바른 생년월일 형식이 아닙니다.'),

    handleValidationErrors
];

// 로그인 유효성 검사 규칙
const validateLogin = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('아이디를 입력해주세요.'),

    body('password')
        .notEmpty()
        .withMessage('비밀번호를 입력해주세요.'),

    handleValidationErrors
];

// 프로필 업데이트 유효성 검사 규칙
const validateProfileUpdate = [
    body('email')
        .optional()
        .isEmail()
        .withMessage('유효한 이메일 주소를 입력해주세요.'),

    body('phoneNumber')
        .optional()
        .matches(/^01[016789]-?\d{3,4}-?\d{4}$/)
        .withMessage('유효한 전화번호 형식이 아닙니다.'),

    handleValidationErrors
];

// 비밀번호 재설정 유효성 검사 규칙
const validatePasswordReset = [
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('비밀번호는 최소 8자 이상이어야 합니다.')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/)
        .withMessage('비밀번호는 영문자, 숫자, 특수문자를 포함해야 합니다.'),

    handleValidationErrors
];

// 이메일 인증 코드 유효성 검사 규칙
const validateVerificationCode = [
    body('email')
        .isEmail()
        .withMessage('유효한 이메일 주소를 입력해주세요.'),

    body('code')
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .withMessage('유효한 인증 코드가 아닙니다.'),

    handleValidationErrors
];

module.exports = {
    validateRegistration,
    validateLogin,
    validateProfileUpdate,
    validatePasswordReset,
    validateVerificationCode,
    handleValidationErrors
};