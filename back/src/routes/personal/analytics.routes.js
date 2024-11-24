const express = require('express');
const router = express.Router();
const analyticsController = require('../../controllers/personal/analytics.controller');
const auth = require('../../middleware/personal/auth.middleware');
const { isGroupAdmin, isMember } = require('../../middleware/personal/');

// 학습 통계 조회
router.get('/study/:userId',
    auth,
    analyticsController.getStudyAnalytics
);

// 목표 달성률 분석
router.get('/goals/:userId',
    auth,
    analyticsController.getGoalAnalytics
);

// 학습 패턴 분석
router.get('/patterns/:userId',
    auth,
    analyticsController.getStudyPatterns
);

// 성과 비교 분석
router.get('/performance/:userId',
    auth,
    analyticsController.getPerformanceComparison
);

// 그룹 전체 학습 통계
router.get('/group/:groupId',
    auth,
    isMember(),
    analyticsController.getGroupAnalytics
);

// 개인별 학습 성과 분석
router.get('/member/:groupId/:userId',
    auth,
    isMember(),
    analyticsController.getMemberAnalytics
);

// 퀴즈 성과 분석
router.get('/quiz/:groupId',
    auth,
    isMember(),
    analyticsController.getQuizAnalytics
);

module.exports = router;