const { body } = require('express-validator');

class Validator {
    // 회원가입 유효성 검사
    validateRegistration() {
        return [
            body('username')
                .trim()
                .isLength({ min: 4, max: 20 })
                .withMessage('아이디는 4~20자 사이여야 합니다.')
                .matches(/^[a-zA-Z0-9_]+$/)
                .withMessage('아이디는 영문, 숫자, 언더스코어만 사용 가능합니다.'),

            body('password')
                .isLength({ min: 8 })
                .withMessage('비밀번호는 최소 8자 이상이어야 합니다.')
                .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/)
                .withMessage('비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.'),

            body('email')
                .isEmail()
                .withMessage('유효한 이메일 주소를 입력해주세요.')
                .normalizeEmail(),

            body('phoneNumber')
                .matches(/^01[0-9]-\d{4}-\d{4}$/)
                .withMessage('올바른 전화번호 형식이 아닙니다.'),

            body('birthdate')
                .isDate()
                .withMessage('올바른 생년월일 형식이 아닙니다.')
        ];
    }

    // 로그인 유효성 검사
    validateLogin() {
        return [
            body('username')
                .trim()
                .notEmpty()
                .withMessage('아이디를 입력해주세요.'),

            body('password')
                .notEmpty()
                .withMessage('비밀번호를 입력해주세요.')
        ];
    }

    // 이메일 형식 검사
    validateEmail() {
        return [
            body('email')
                .isEmail()
                .withMessage('유효한 이메일 주소를 입력해주세요.')
                .normalizeEmail()
        ];
    }

    // 비밀번호 재설정 유효성 검사
    validatePasswordReset() {
        return [
            body('username')
                .trim()
                .notEmpty()
                .withMessage('아이디를 입력해주세요.'),

            body('newPassword')
                .isLength({ min: 8 })
                .withMessage('비밀번호는 최소 8자 이상이어야 합니다.')
                .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/)
                .withMessage('비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.')
        ];
    }

    // 아이디 찾기 유효성 검사
    validateFindUsername() {
        return [
            body('name')
                .trim()
                .notEmpty()
                .withMessage('이름을 입력해주세요.'),

            body('email')
                .isEmail()
                .withMessage('유효한 이메일 주소를 입력해주세요.')
                .normalizeEmail()
        ];
    }
}

module.exports = new Validator();