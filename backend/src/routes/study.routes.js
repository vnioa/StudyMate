const express = require('express');
const router = express.Router();
const studyController = require('../controllers/study.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validateId, requireFields } = require('../middlewares/validator.middleware');
const upload = require('../middlewares/upload.middleware');
const {createUploadMiddleware, processUploadedFile} = require("../middlewares/upload.middleware");

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 대시보드 관련 라우트
router.get('/dashboard', studyController.getDashboardData);

// 세션 관련 라우트
router.post('/sessions/start', studyController.startStudySession);

router.post('/sessions/:sessionId/end',
    validateId('sessionId'),
    studyController.endStudySession
);

router.get('/sessions/stats', studyController.getSessionStats);

router.post('/sessions/end',
    requireFields(['cycles', 'notes', 'totalTime', 'focusMode', 'endTime']),
    studyController.endSession
);

router.put('/sessions/cycles',
    requireFields(['cycles', 'timestamp']),
    studyController.updateCycles
);

router.post('/sessions/notes',
    requireFields(['notes', 'sessionId']),
    studyController.saveNotes
);

// 통계 및 분석 라우트
router.get('/statistics', studyController.getStatistics);

router.get('/recommendations', studyController.getRecommendations);

router.get('/analytics/:timeRange',
    requireFields(['timeRange']),
    studyController.getAnalytics
);

router.get('/subjects/:subjectId/analytics',
    validateId('subjectId'),
    requireFields(['timeRange']),
    studyController.getSubjectAnalytics
);

// 일정 관련 라우트
router.get('/schedules', studyController.getSchedules);

router.post('/schedules',
    requireFields(['title', 'startTime', 'endTime', 'repeat', 'notification', 'shared']),
    studyController.createSchedule
);

router.put('/schedules/:scheduleId',
    validateId('scheduleId'),
    studyController.updateSchedule
);

router.delete('/schedules/:scheduleId',
    validateId('scheduleId'),
    studyController.deleteSchedule
);

// 피드백 관련 라우트
router.post('/feedback/journal',
    requireFields(['content', 'achievements', 'difficulties', 'improvements', 'nextGoals']),
    studyController.saveJournal
);

router.get('/feedback', studyController.getFeedback);

router.post('/feedback/self-evaluation',
    requireFields(['understanding', 'effort', 'efficiency', 'notes']),
    studyController.saveSelfEvaluation
);

// 학습 자료 관련 라우트
router.get('/materials', studyController.getMaterials);

router.post('/materials',
    createUploadMiddleware('material', 5),
    processUploadedFile,
    studyController.uploadMaterial
);

router.delete('/materials/:materialId',
    validateId('materialId'),
    studyController.deleteMaterial
);

router.post('/materials/:materialId/share',
    validateId('materialId'),
    studyController.shareMaterial
);

router.put('/materials/:materialId/version',
    validateId('materialId'),
    studyController.updateVersion
);

module.exports = router;