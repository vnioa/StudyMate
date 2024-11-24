const express = require('express');
const router = express.Router();
const summaryController = require('../../controllers/dashboard/summary.controller');
const streakController = require('../../controllers/dashboard/streak.controller');
const achievementController = require('../../controllers/dashboard/achievement.controller');
const auth = require('../../middleware/personal/auth.middleware');

// 오늘의 학습 요약
router.get('/summary/:userId',
    auth,
    summaryController.getDailySummary
);

// 주간/월간 학습 통계
router.get('/stats/:userId',
    auth,
    summaryController.getPeriodStats
);

// 다가오는 일정
router.get('/events/:userId',
    auth,
    summaryController.getUpcomingEvents
);

// 학습 스트릭
router.get('/streak/:userId',
    auth,
    streakController.getStreakStatus
);

router.put('/streak/:userId',
    auth,
    streakController.updateStreak
);

// 성취 뱃지 및 레벨
router.get('/achievements/:userId',
    auth,
    achievementController.getAchievements
);

router.post('/achievements/:userId/badge',
    auth,
    achievementController.earnBadge
);

router.put('/achievements/:userId/level',
    auth,
    achievementController.updateLevel
);

module.exports = router;