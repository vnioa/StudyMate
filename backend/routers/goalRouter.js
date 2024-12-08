const express = require('express');
const router = express.Router();
const {
    createGoal,
    getGoals,
    getGoalDetail,
    updateGoal,
    updateGoalProgress,
    updateGoalStatus,
    deleteGoal,
    getCategories,
    validateGoal
} = require('../controllers/goalController');

// 목표 생성 및 목록 조회
router.post('/', createGoal);
router.get('/', getGoals);

// 목표 상세 조회, 수정, 삭제
router.get('/:goalId', getGoalDetail);
router.put('/:goalId', updateGoal);
router.delete('/:goalId', deleteGoal);

// 목표 진행률 업데이트
router.put('/:goalId/progress', updateGoalProgress);

// 목표 상태 변경
router.put('/:goalId/status', updateGoalStatus);

// 목표 카테고리 관련
router.get('/categories', getCategories);

// 목표 유효성 검사
router.post('/validate', validateGoal);

module.exports = router;