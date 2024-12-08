const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireFields } = require('../middlewares/validator.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 피드백 정보 조회
router.get('/', feedbackController.getFeedback);

// 자기 평가 이력 조회
router.get('/self-evaluation/history', feedbackController.getSelfEvaluationHistory);

// 학습 일지 이력 조회
router.get('/journal/history', feedbackController.getJournalHistory);

// 자기 평가 저장
router.post('/self-evaluation',
    requireFields(['understanding', 'effort', 'efficiency', 'notes', 'date']),
    feedbackController.saveSelfEvaluation
);

// 학습 일지 저장
router.post('/journal',
    requireFields(['date', 'content', 'achievements', 'difficulties', 'improvements', 'nextGoals']),
    feedbackController.saveJournal
);

module.exports = router;