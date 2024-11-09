// controllers/myStudyController.js

const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// 대시보드 데이터 조회
exports.getDashboardData = async (req, res) => {
    const userId = req.user.id;
    try {
        const [goalSummary] = await db.execute(
            'SELECT COUNT(*) as totalGoals, SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completedGoals FROM learning_goals WHERE user_id = ?',
            [userId]
        );

        const [recentActivities] = await db.execute(
            'SELECT activity_type, description, created_at FROM learning_activities WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
            [userId]
        );

        const [ongoingQuizzes] = await db.execute(
            'SELECT id, title, due_date FROM quizzes WHERE user_id = ? AND status = "ongoing" ORDER BY due_date ASC LIMIT 3',
            [userId]
        );

        const today = new Date().toISOString().split('T')[0];
        const [todaySchedule] = await db.execute(
            'SELECT id, title, start_time FROM study_schedules WHERE user_id = ? AND DATE(start_time) = ? ORDER BY start_time ASC',
            [userId, today]
        );

        const [userAchievements] = await db.execute(
            'SELECT level, experience_points, badges FROM user_achievements WHERE user_id = ?',
            [userId]
        );

        res.status(200).json({
            success: true,
            data: {
                goalSummary: goalSummary[0],
                recentActivities,
                ongoingQuizzes,
                todaySchedule,
                achievements: userAchievements[0]
            }
        });
    } catch (error) {
        console.error('대시보드 데이터 조회 오류:', error);
        res.status(500).json({ success: false, message: '대시보드 데이터 조회에 실패했습니다.' });
    }
};

// 학습 목표 관리
exports.createGoal = async (req, res) => {
    const { title, description, deadline, priority } = req.body;
    const userId = req.user.id;
    try {
        const [result] = await db.execute(
            'INSERT INTO learning_goals (user_id, title, description, deadline, priority) VALUES (?, ?, ?, ?, ?)',
            [userId, title, description, deadline, priority]
        );
        res.status(201).json({ success: true, message: '학습 목표가 생성되었습니다.', goalId: result.insertId });
    } catch (error) {
        console.error('학습 목표 생성 오류:', error);
        res.status(500).json({ success: false, message: '학습 목표 생성에 실패했습니다.' });
    }
};

exports.getGoals = async (req, res) => {
    const userId = req.user.id;
    try {
        const [goals] = await db.execute(
            'SELECT * FROM learning_goals WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        res.status(200).json({ success: true, goals });
    } catch (error) {
        console.error('학습 목표 조회 오류:', error);
        res.status(500).json({ success: false, message: '학습 목표 조회에 실패했습니다.' });
    }
};

exports.updateGoal = async (req, res) => {
    const { goalId, title, description, deadline, priority, status } = req.body;
    const userId = req.user.id;
    try {
        await db.execute(
            'UPDATE learning_goals SET title = ?, description = ?, deadline = ?, priority = ?, status = ? WHERE id = ? AND user_id = ?',
            [title, description, deadline, priority, status, goalId, userId]
        );
        res.status(200).json({ success: true, message: '학습 목표가 업데이트되었습니다.' });
    } catch (error) {
        console.error('학습 목표 업데이트 오류:', error);
        res.status(500).json({ success: false, message: '학습 목표 업데이트에 실패했습니다.' });
    }
};

exports.deleteGoal = async (req, res) => {
    const { goalId } = req.params;
    const userId = req.user.id;
    try {
        await db.execute('DELETE FROM learning_goals WHERE id = ? AND user_id = ?', [goalId, userId]);
        res.status(200).json({ success: true, message: '학습 목표가 삭제되었습니다.' });
    } catch (error) {
        console.error('학습 목표 삭제 오류:', error);
        res.status(500).json({ success: false, message: '학습 목표 삭제에 실패했습니다.' });
    }
};

// 학습 일정 관리
exports.createSchedule = async (req, res) => {
    const { title, start_time, end_time } = req.body;
    const userId = req.user.id;
    try {
        const [result] = await db.execute(
            'INSERT INTO study_schedules (user_id, title, start_time, end_time) VALUES (?, ?, ?, ?)',
            [userId, title, start_time, end_time]
        );
        res.status(201).json({ success: true, message: '학습 일정이 생성되었습니다.', scheduleId: result.insertId });
    } catch (error) {
        console.error('학습 일정 생성 오류:', error);
        res.status(500).json({ success: false, message: '학습 일정 생성에 실패했습니다.' });
    }
};

exports.getSchedules = async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    try {
        const [schedules] = await db.execute(
            'SELECT * FROM study_schedules WHERE user_id = ? AND start_time BETWEEN ? AND ? ORDER BY start_time ASC',
            [userId, startDate, endDate]
        );
        res.status(200).json({ success: true, schedules });
    } catch (error) {
        console.error('학습 일정 조회 오류:', error);
        res.status(500).json({ success: false, message: '학습 일정 조회에 실패했습니다.' });
    }
};

exports.updateSchedule = async (req, res) => {
    const { scheduleId, title, start_time, end_time } = req.body;
    const userId = req.user.id;
    try {
        await db.execute(
            'UPDATE study_schedules SET title = ?, start_time = ?, end_time = ? WHERE id = ? AND user_id = ?',
            [title, start_time, end_time, scheduleId, userId]
        );
        res.status(200).json({ success: true, message: '학습 일정이 업데이트되었습니다.' });
    } catch (error) {
        console.error('학습 일정 업데이트 오류:', error);
        res.status(500).json({ success: false, message: '학습 일정 업데이트에 실패했습니다.' });
    }
};

exports.deleteSchedule = async (req, res) => {
    const { scheduleId } = req.params;
    const userId = req.user.id;
    try {
        await db.execute('DELETE FROM study_schedules WHERE id = ? AND user_id = ?', [scheduleId, userId]);
        res.status(200).json({ success: true, message: '학습 일정이 삭제되었습니다.' });
    } catch (error) {
        console.error('학습 일정 삭제 오류:', error);
        res.status(500).json({ success: false, message: '학습 일정 삭제에 실패했습니다.' });
    }
};

// 학습 시간 관리
exports.startLearningSession = async (req, res) => {
    const userId = req.user.id;
    const { subject } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO learning_sessions (user_id, subject, start_time) VALUES (?, ?, NOW())',
            [userId, subject]
        );
        res.status(201).json({ success: true, sessionId: result.insertId });
    } catch (error) {
        console.error('학습 세션 시작 오류:', error);
        res.status(500).json({ success: false, message: '학습 세션 시작에 실패했습니다.' });
    }
};

exports.endLearningSession = async (req, res) => {
    const userId = req.user.id;
    const { sessionId } = req.params;
    try {
        await db.execute(
            'UPDATE learning_sessions SET end_time = NOW(), duration = TIMESTAMPDIFF(SECOND, start_time, NOW()) WHERE id = ? AND user_id = ?',
            [sessionId, userId]
        );
        res.status(200).json({ success: true, message: '학습 세션이 종료되었습니다.' });
    } catch (error) {
        console.error('학습 세션 종료 오류:', error);
        res.status(500).json({ success: false, message: '학습 세션 종료에 실패했습니다.' });
    }
};

exports.getLearningHistory = async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    try {
        const [history] = await db.execute(
            'SELECT * FROM learning_sessions WHERE user_id = ? AND start_time BETWEEN ? AND ? ORDER BY start_time DESC',
            [userId, startDate, endDate]
        );
        res.status(200).json({ success: true, history });
    } catch (error) {
        console.error('학습 기록 조회 오류:', error);
        res.status(500).json({ success: false, message: '학습 기록 조회에 실패했습니다.' });
    }
};

// 퀴즈 및 테스트 관리
exports.createQuiz = async (req, res) => {
    const { title, questions } = req.body;
    const userId = req.user.id;
    try {
        const [result] = await db.execute(
            'INSERT INTO quizzes (user_id, title) VALUES (?, ?)',
            [userId, title]
        );
        const quizId = result.insertId;

        for (let question of questions) {
            await db.execute(
                'INSERT INTO quiz_questions (quiz_id, question, correct_answer, options) VALUES (?, ?, ?, ?)',
                [quizId, question.question, question.correctAnswer, JSON.stringify(question.options)]
            );
        }

        res.status(201).json({ success: true, message: '퀴즈가 생성되었습니다.', quizId });
    } catch (error) {
        console.error('퀴즈 생성 오류:', error);
        res.status(500).json({ success: false, message: '퀴즈 생성에 실패했습니다.' });
    }
};

exports.getQuizzes = async (req, res) => {
    const userId = req.user.id;
    try {
        const [quizzes] = await db.execute(
            'SELECT * FROM quizzes WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        res.status(200).json({ success: true, quizzes });
    } catch (error) {
        console.error('퀴즈 목록 조회 오류:', error);
        res.status(500).json({ success: false, message: '퀴즈 목록 조회에 실패했습니다.' });
    }
};

exports.getQuizDetails = async (req, res) => {
    const { quizId } = req.params;
    const userId = req.user.id;
    try {
        const [quiz] = await db.execute(
            'SELECT * FROM quizzes WHERE id = ? AND user_id = ?',
            [quizId, userId]
        );
        if (quiz.length === 0) {
            return res.status(404).json({ success: false, message: '퀴즈를 찾을 수 없습니다.' });
        }

        const [questions] = await db.execute(
            'SELECT * FROM quiz_questions WHERE quiz_id = ?',
            [quizId]
        );

        res.status(200).json({
            success: true,
            quiz: quiz[0],
            questions: questions.map(q => ({...q, options: JSON.parse(q.options)}))
        });
    } catch (error) {
        console.error('퀴즈 상세 조회 오류:', error);
        res.status(500).json({ success: false, message: '퀴즈 상세 조회에 실패했습니다.' });
    }
};

exports.submitQuizResult = async (req, res) => {
    const { quizId, answers } = req.body;
    const userId = req.user.id;
    try {
        const [questions] = await db.execute(
            'SELECT * FROM quiz_questions WHERE quiz_id = ?',
            [quizId]
        );

        let score = 0;
        for (let i = 0; i < questions.length; i++) {
            if (questions[i].correct_answer === answers[i]) {
                score++;
            }
        }

        await db.execute(
            'INSERT INTO quiz_results (user_id, quiz_id, score, total_questions) VALUES (?, ?, ?, ?)',
            [userId, quizId, score, questions.length]
        );

        res.status(200).json({ success: true, score, totalQuestions: questions.length });
    } catch (error) {
        console.error('퀴즈 결과 제출 오류:', error);
        res.status(500).json({ success: false, message: '퀴즈 결과 제출에 실패했습니다.' });
    }
};

exports.uploadMaterial = async (req, res) => {
    const { title, description, category } = req.body;
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ success: false, message: '파일이 업로드되지 않았습니다.' });
    }

    try {
        const [result] = await db.execute(
            'INSERT INTO study_materials (user_id, title, description, category, file_path) VALUES (?, ?, ?, ?, ?)',
            [userId, title, description, category, file.path]
        );
        res.status(201).json({ success: true, message: '자료가 업로드되었습니다.', materialId: result.insertId });
    } catch (error) {
        console.error('자료 업로드 오류:', error);
        res.status(500).json({ success: false, message: '자료 업로드에 실패했습니다.' });
    }
};

exports.getMaterials = async (req, res) => {
    const userId = req.user.id;
    const { category } = req.query;

    try {
        let query = 'SELECT * FROM study_materials WHERE user_id = ?';
        let params = [userId];

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        query += ' ORDER BY created_at DESC';

        const [materials] = await db.execute(query, params);
        res.status(200).json({ success: true, materials });
    } catch (error) {
        console.error('자료 조회 오류:', error);
        res.status(500).json({ success: false, message: '자료 조회에 실패했습니다.' });
    }
};

exports.deleteMaterial = async (req, res) => {
    const { materialId } = req.params;
    const userId = req.user.id;

    try {
        const [material] = await db.execute('SELECT * FROM study_materials WHERE id = ? AND user_id = ?', [materialId, userId]);

        if (material.length === 0) {
            return res.status(404).json({ success: false, message: '자료를 찾을 수 없습니다.' });
        }

        await db.execute('DELETE FROM study_materials WHERE id = ?', [materialId]);

        // 파일 시스템에서 실제 파일 삭제
        fs.unlinkSync(material[0].file_path);

        res.status(200).json({ success: true, message: '자료가 삭제되었습니다.' });
    } catch (error) {
        console.error('자료 삭제 오류:', error);
        res.status(500).json({ success: false, message: '자료 삭제에 실패했습니다.' });
    }
};

exports.downloadMaterial = async (req, res) => {
    const { materialId } = req.params;
    const userId = req.user.id;

    try {
        const [material] = await db.execute('SELECT * FROM study_materials WHERE id = ? AND user_id = ?', [materialId, userId]);

        if (material.length === 0) {
            return res.status(404).json({ success: false, message: '자료를 찾을 수 없습니다.' });
        }

        res.download(material[0].file_path, material[0].title, (err) => {
            if (err) {
                console.error('파일 다운로드 오류:', err);
                res.status(500).json({ success: false, message: '파일 다운로드에 실패했습니다.' });
            }
        });
    } catch (error) {
        console.error('자료 다운로드 오류:', error);
        res.status(500).json({ success: false, message: '자료 다운로드에 실패했습니다.' });
    }
};

// 성과 분석
exports.getPerformanceData = async (req, res) => {
    const userId = req.user.id;
    try {
        // 학습 시간 통계
        const [learningStats] = await db.execute(
            'SELECT SUM(duration) as totalTime, AVG(duration) as avgTime FROM learning_sessions WHERE user_id = ?',
            [userId]
        );

        // 목표 달성률
        const [goalStats] = await db.execute(
            'SELECT COUNT(*) as totalGoals, SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completedGoals FROM learning_goals WHERE user_id = ?',
            [userId]
        );

        // 퀴즈 성적
        const [quizStats] = await db.execute(
            'SELECT AVG(score/total_questions * 100) as avgScore FROM quiz_results WHERE user_id = ?',
            [userId]
        );

        res.status(200).json({
            success: true,
            data: {
                learningStats: learningStats[0],
                goalStats: goalStats[0],
                quizStats: quizStats[0]
            }
        });
    } catch (error) {
        console.error('성과 분석 데이터 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '성과 분석 데이터 조회에 실패했습니다.'
        });
    }
};

// 성취 및 보상
exports.getAchievements = async (req, res) => {
    const userId = req.user.id;
    try {
        const [achievements] = await db.execute(
            'SELECT * FROM achievements WHERE user_id = ?',
            [userId]
        );

        res.status(200).json({
            success: true,
            achievements
        });
    } catch (error) {
        console.error('성취 데이터 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '성취 데이터 조회에 실패했습니다.'
        });
    }
};

exports.updateAchievement = async (req, res) => {
    const userId = req.user.id;
    const { achievementId } = req.params;
    try {
        await db.execute(
            'UPDATE achievements SET status = "completed", completed_at = NOW() WHERE id = ? AND user_id = ?',
            [achievementId, userId]
        );

        res.status(200).json({
            success: true,
            message: '성취가 업데이트되었습니다.'
        });
    } catch (error) {
        console.error('성취 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '성취 업데이트에 실패했습니다.'
        });
    }
};