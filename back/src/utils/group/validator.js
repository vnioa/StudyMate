const { body, validationResult } = require('express-validator');

class GroupValidator {
    // 그룹 생성 유효성 검사
    validateGroupCreation() {
        return [
            body('name')
                .trim()
                .isLength({ min: 2, max: 50 })
                .withMessage('그룹명은 2~50자 사이여야 합니다.'),

            body('description')
                .trim()
                .isLength({ min: 10, max: 500 })
                .withMessage('그룹 설명은 10~500자 사이여야 합니다.'),

            body('category')
                .trim()
                .notEmpty()
                .withMessage('카테고리를 선택해주세요.'),

            body('maxMembers')
                .isInt({ min: 2, max: 100 })
                .withMessage('멤버 제한은 2~100명 사이여야 합니다.')
        ];
    }

    // 학습 자료 업로드 유효성 검사
    validateMaterialUpload() {
        return [
            body('title')
                .trim()
                .isLength({ min: 2, max: 100 })
                .withMessage('자료 제목은 2~100자 사이여야 합니다.'),

            body('description')
                .trim()
                .isLength({ max: 1000 })
                .withMessage('자료 설명은 1000자를 초과할 수 없습니다.'),

            body('tags')
                .isArray()
                .withMessage('태그는 배열 형태여야 합니다.')
        ];
    }

    // 퀴즈 생성 유효성 검사
    validateQuizCreation() {
        return [
            body('title')
                .trim()
                .isLength({ min: 2, max: 100 })
                .withMessage('퀴즈 제목은 2~100자 사이여야 합니다.'),

            body('questions')
                .isArray({ min: 1 })
                .withMessage('최소 1개 이상의 문제가 필요합니다.'),

            body('timeLimit')
                .isInt({ min: 1, max: 180 })
                .withMessage('시간 제한은 1~180분 사이여야 합니다.')
        ];
    }

    // 일정 생성 유효성 검사
    validateScheduleCreation() {
        return [
            body('title')
                .trim()
                .isLength({ min: 2, max: 100 })
                .withMessage('일정 제목은 2~100자 사이여야 합니다.'),

            body('startTime')
                .isISO8601()
                .withMessage('올바른 시작 시간 형식이 아닙니다.'),

            body('endTime')
                .isISO8601()
                .withMessage('올바른 종료 시간 형식이 아닙니다.')
                .custom((endTime, { req }) => {
                    if (new Date(endTime) <= new Date(req.body.startTime)) {
                        throw new Error('종료 시간은 시작 시간보다 늦어야 합니다.');
                    }
                    return true;
                })
        ];
    }

    // 유효성 검사 결과 처리
    handleValidationErrors(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
}

module.exports = new GroupValidator();