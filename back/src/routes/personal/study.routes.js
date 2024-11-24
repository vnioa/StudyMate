const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/session.controller');
const materialController = require('../controllers/material.controller');
const analyticsController = require('../controllers/analytics.controller');
const auth = require('../middleware/auth');

// 학습 세션 관리
router.post('/sessions/start',
    auth,
    sessionController.startSession
);

router.put('/sessions/:sessionId/end',
    auth,
    sessionController.endSession
);

router.get('/sessions',
    auth,
    sessionController.getSessions
);

// 포모도로 타이머
router.post('/sessions/pomodoro',
    auth,
    sessionController.setPomodoroTimer
);

// 학습 자료 관리
router.post('/materials',
    auth,
    materialController.uploadMaterial
);

router.get('/materials',
    auth,
    materialController.getMaterials
);

router.post('/materials/:materialId/versions',
    auth,
    materialController.createVersion
);

router.delete('/materials/:materialId',
    auth,
    materialController.deleteMaterial
);

// 학습 분석
router.get('/analytics/study',
    auth,
    analyticsController.getStudyAnalytics
);

router.get('/analytics/patterns',
    auth,
    analyticsController.getStudyPatterns
);

router.get('/analytics/performance',
    auth,
    analyticsController.getPerformanceComparison
);

module.exports = router;