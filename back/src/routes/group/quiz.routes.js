const express = require('express');
const router = express.Router();
const quizController = require('../../controllers/group/quiz.controller');
const auth = require('../../middleware/group/auth.middleware');
const { isGroupAdmin, isMember } = require('../../middleware/group/role.middleware');

// 퀴즈 생성 및 관리
router.post('/:groupId/quiz',
    auth,
    isGroupAdmin(),
    quizController.createQuiz
);

router.get('/:groupId/quiz',
    auth,
    isMember(),
    quizController.getQuizzes
);

// 퀴즈 제출 및 결과
router.post('/:groupId/quiz/:quizId/submit',
    auth,
    isMember(),
    quizController.submitQuiz
);

router.get('/:groupId/quiz/:quizId/results',
    auth,
    isMember(),
    quizController.getQuizResults
);

// 퀴즈 분석
router.get('/:groupId/quiz/:quizId/analysis',
    auth,
    isGroupAdmin(),
    quizController.analyzeQuizResults
);

// 복습 계획
router.get('/:groupId/quiz/:quizId/review-plan',
    auth,
    isMember(),
    quizController.generateReviewPlan
);

// 퀴즈 수정 및 삭제
router.put('/:groupId/quiz/:quizId',
    auth,
    isGroupAdmin(),
    quizController.updateQuiz
);

router.delete('/:groupId/quiz/:quizId',
    auth,
    isGroupAdmin(),
    quizController.deleteQuiz
);

module.exports = router;