const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validateId, requireFields } = require('../middlewares/validator.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 질문 관련 라우트
router.post('/questions/validate',
    requireFields(['title', 'content']),
    communityController.validateQuestion
);

router.post('/questions',
    requireFields(['title', 'content']),
    communityController.createQuestion
);

router.get('/questions', communityController.getQuestions);

router.get('/questions/:questionId',
    validateId('questionId'),
    communityController.getQuestion
);

router.put('/questions/:questionId',
    validateId('questionId'),
    requireFields(['title', 'content']),
    communityController.updateQuestion
);

router.delete('/questions/:questionId',
    validateId('questionId'),
    communityController.deleteQuestion
);

// 답변 관련 라우트
router.post('/questions/:questionId/answers',
    validateId('questionId'),
    requireFields(['content']),
    communityController.createAnswer
);

router.put('/answers/:answerId',
    validateId('answerId'),
    requireFields(['content']),
    communityController.updateAnswer
);

router.delete('/answers/:answerId',
    validateId('answerId'),
    communityController.deleteAnswer
);

// 스터디 그룹 관련 라우트
router.post('/groups',
    requireFields(['name', 'category', 'description']),
    communityController.createStudyGroup
);

router.get('/groups/:groupId',
    validateId('groupId'),
    communityController.getStudyGroup
);

// 멘토 관련 라우트
router.post('/mentors',
    requireFields(['field', 'experience', 'introduction']),
    communityController.registerMentor
);

router.get('/mentors/:mentorId',
    validateId('mentorId'),
    communityController.getMentorDetail
);

router.post('/mentors/:mentorId/chat',
    validateId('mentorId'),
    communityController.startMentorChat
);

module.exports = router;