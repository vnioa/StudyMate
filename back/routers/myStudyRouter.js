// routers/myStudyRouter.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const myStudyController = require('../controllers/myStudyController');
const authMiddleware = require('../middleware/authMiddleware');

// 파일 업로드를 위한 multer 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// 대시보드
router.get('/dashboard', myStudyController.getDashboardData);

// 목표 관리
router.post('/goals', myStudyController.createGoal);
router.get('/goals', myStudyController.getGoals);
router.put('/goals/:goalId', myStudyController.updateGoal);
router.delete('/goals/:goalId', myStudyController.deleteGoal);

// 학습 일정
router.post('/schedules', myStudyController.createSchedule);
router.get('/schedules', myStudyController.getSchedules);
router.put('/schedules/:scheduleId', myStudyController.updateSchedule);
router.delete('/schedules/:scheduleId', myStudyController.deleteSchedule);

// 학습 시간 관리
router.post('/learning-sessions', myStudyController.startLearningSession);
router.put('/learning-sessions/:sessionId', myStudyController.endLearningSession);
router.get('/learning-history', myStudyController.getLearningHistory);

// 퀴즈 및 테스트
router.post('/quizzes', myStudyController.createQuiz);
router.get('/quizzes', myStudyController.getQuizzes);
router.get('/quizzes/:quizId', myStudyController.getQuizDetails);
router.post('/quizzes/:quizId/submit', myStudyController.submitQuizResult);

// 학습 자료 관리
router.post('/materials', upload.single('file'), myStudyController.uploadMaterial);
router.get('/materials', myStudyController.getMaterials);
router.delete('/materials/:materialId', myStudyController.deleteMaterial);
router.get('/materials/download/:materialId', myStudyController.downloadMaterial);

// 성과 분석
router.get('/performance', myStudyController.getPerformanceData);

// 성취 및 보상
router.get('/achievements', myStudyController.getAchievements);
router.post('/achievements/:achievementId', myStudyController.updateAchievement);

module.exports = router;