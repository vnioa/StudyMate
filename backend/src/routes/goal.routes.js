const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goal.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validateId, requireFields } = require('../middlewares/validator.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 목표 생성
router.post('/',
    requireFields(['title', 'category', 'deadline', 'description']),
    goalController.createGoal
);

// 목표 목록 조회
router.get('/', goalController.getGoals);

// 목표 상세 조회
router.get('/:goalId',
    validateId('goalId'),
    goalController.getGoalDetail
);

// 목표 수정
router.put('/:goalId',
    validateId('goalId'),
    requireFields(['title', 'deadline', 'description']),
    goalController.updateGoal
);

// 목표 진행률 업데이트
router.put('/:goalId/progress',
    validateId('goalId'),
    requireFields(['progress']),
    goalController.updateGoalProgress
);

// 목표 상태 변경
router.put('/:goalId/status',
    validateId('goalId'),
    requireFields(['status']),
    goalController.updateGoalStatus
);

// 목표 삭제
router.delete('/:goalId',
    validateId('goalId'),
    goalController.deleteGoal
);

// 목표 카테고리 목록 조회
router.get('/categories', goalController.getCategories);

// 목표 유효성 검사
router.post('/validate',
    requireFields(['title', 'category', 'deadline', 'description']),
    goalController.validateGoal
);

module.exports = router;