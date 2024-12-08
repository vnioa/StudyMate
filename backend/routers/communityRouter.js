const express = require('express');
const router = express.Router();
const {
    validateQuestion,
    createQuestion,
    getQuestions,
    getQuestion,
    updateQuestion,
    deleteQuestion,
    createAnswer,
    deleteAnswer,
    updateAnswer,
    getData
} = require('../controllers/communityController');

// 질문 관련 라우트
router.post('/questions/validate', validateQuestion);
router.post('/questions', createQuestion);
router.get('/questions', getQuestions);
router.get('/questions/:questionId', getQuestion);
router.put('/questions/:questionId', updateQuestion);
router.delete('/questions/:questionId', deleteQuestion);

// 답변 관련 라우트
router.post('/questions/:questionId/answers', createAnswer);
router.put('/answers/:answerId', updateAnswer);
router.delete('/answers/:answerId', deleteAnswer);

// 커뮤니티 데이터 조회
router.get('/:tab', getData);

module.exports = router;