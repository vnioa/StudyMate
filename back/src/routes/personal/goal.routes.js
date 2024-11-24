const express = require('express');
const router = express.Router();
const goalController = require('../../controllers/goals/goal.controller');
const auth = require('../../middleware/auth.middleware');

// 학습 목표 생성
router.post('/:userId/goals',
    auth,
    goalController.createGoal
);

// 목표 진행 상황 업데이트
router.put('/:userId/goals/:goalId/progress',
    auth,
    goalController.updateProgress
);

// 목표 목록 조회
router.get('/:userId/goals',
    auth,
    goalController.getGoals
);

// 목표 삭제
router.delete('/:userId/goals/:goalId',
    auth,
    goalController.deleteGoal
);

// 목표 타입별 조회
router.get('/:userId/goals/type/:type',
    auth,
    goalController.getGoals
);

// 목표 마일스톤 업데이트
router.put('/:userId/goals/:goalId/milestones',
    auth,
    goalController.updateMilestones
);

// 목표 리마인더 설정
router.post('/:userId/goals/:goalId/reminders',
    auth,
    goalController.setReminders
);

module.exports = router;