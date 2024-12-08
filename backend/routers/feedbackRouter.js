const express = require('express');
const router = express.Router();
const {
    getFeedback,
    getSelfEvaluationHistory,
    getJournalHistory,
    saveSelfEvaluation,
    saveJournal
} = require('../controllers/feedbackController');

// 피드백 정보 조회
router.get('/', getFeedback);

// 자기 평가 관련 라우트
router.get('/self-evaluation/history', getSelfEvaluationHistory);
router.post('/self-evaluation', saveSelfEvaluation);

// 학습 일지 관련 라우트
router.get('/journal/history', getJournalHistory);
router.post('/journal', saveJournal);

module.exports = router;