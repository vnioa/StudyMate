const express = require('express');
const router = express.Router();
const analyticsController = require('../../controllers/group/analytics.controller');
const auth = require('../../middleware/group/auth.middleware');
const { isGroupAdmin, isMember } = require('../../middleware/group/role.middleware');

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

// 그룹 활동 트렌드 분석
router.get('/activity/:groupId',
    auth,
    isMember(),
    analyticsController.getActivityTrends
);

module.exports = router;