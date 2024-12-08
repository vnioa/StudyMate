const express = require('express');
const router = express.Router();
const {
    getDashboard,
    startSession,
    endSession,
    getAnalytics,
    getSubjectAnalytics,
    getSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getFeedback,
    saveSelfEvaluation,
    getMaterials,
    uploadMaterial,
    deleteMaterial,
    shareMaterial,
    updateMaterialVersion,
    getSessionStats,
    endStudySession,
    updateCycles,
    saveNotes
} = require('../controllers/studyController');

// 대시보드 데이터
router.get('/dashboard', getDashboard);

// 학습 세션 관리
router.post('/sessions/start', startSession);
router.post('/sessions/end', endSession);
router.get('/sessions/stats', getSessionStats);
router.put('/sessions/cycles', updateCycles);
router.post('/sessions/notes', saveNotes);
router.post('/sessions/:sessionId/end', endStudySession);

// 학습 분석
router.get('/analytics/:timeRange', getAnalytics);
router.get('/subjects/:subjectId/analytics', getSubjectAnalytics);

// 학습 일정
router.get('/schedules', getSchedules);
router.post('/schedules', createSchedule);
router.put('/schedules/:scheduleId', updateSchedule);
router.delete('/schedules/:scheduleId', deleteSchedule);

// 피드백 및 자기평가
router.get('/feedback', getFeedback);
router.post('/feedback/self-evaluation', saveSelfEvaluation);

// 학습 자료
router.get('/materials', getMaterials);
router.post('/materials', uploadMaterial);
router.delete('/materials/:materialId', deleteMaterial);
router.post('/materials/:materialId/share', shareMaterial);
router.put('/materials/:materialId/version', updateMaterialVersion);

module.exports = router;