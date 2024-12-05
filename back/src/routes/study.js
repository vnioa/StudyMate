const express = require('express');
const router = express.Router();
const studyController = require('../controllers/studyController');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validateId, requireFields } = require('../middlewares/validator.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 대시보드 라우트
router.get('/dashboard', studyController.getDashboardData);

// 세션 관련 라우트
router.post('/sessions/start', studyController.startStudySession);

router.post('/sessions/:sessionId/end',
    validateId('sessionId'),
    studyController.endStudySession
);

router.get('/sessions/stats', studyController.getSessionStats);

// 일정 관련 라우트
router.get('/schedules/search',
    requireFields(['query']),
    studyController.searchSchedules
);

router.post('/schedules/:scheduleId/share',
    validateId('scheduleId'),
    requireFields(['sharedWith', 'permissions']),
    studyController.shareSchedule
);

router.put('/schedules/:scheduleId/version',
    validateId('scheduleId'),
    studyController.updateVersion
);

module.exports = router;