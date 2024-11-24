const db = require('../../config/mysql');

class FeedbackController {
    // 자기 평가 작성
    async createSelfEvaluation(req, res) {
        try {
            const { userId, studySessionId, rating, strengths, weaknesses, improvements } = req.body;

            const [result] = await db.execute(
                'INSERT INTO self_evaluations (user_id, study_session_id, rating, strengths, weaknesses, improvements) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, studySessionId, rating, strengths, weaknesses, improvements]
            );

            res.status(201).json({
                success: true,
                evaluationId: result.insertId,
                message: '자기 평가가 저장되었습니다.'
            });
        } catch (error) {
            console.error('자기 평가 저장 오류:', error);
            res.status(500).json({
                success: false,
                message: '자기 평가 저장에 실패했습니다.'
            });
        }
    }

    // 동료 평가 작성
    async createPeerFeedback(req, res) {
        try {
            const { fromUserId, toUserId, groupId, rating, feedback, suggestions } = req.body;

            const [result] = await db.execute(
                'INSERT INTO peer_feedback (from_user_id, to_user_id, group_id, rating, feedback, suggestions) VALUES (?, ?, ?, ?, ?, ?)',
                [fromUserId, toUserId, groupId, rating, feedback, suggestions]
            );

            res.status(201).json({
                success: true,
                feedbackId: result.insertId,
                message: '동료 평가가 저장되었습니다.'
            });
        } catch (error) {
            console.error('동료 평가 저장 오류:', error);
            res.status(500).json({
                success: false,
                message: '동료 평가 저장에 실패했습니다.'
            });
        }
    }

    // 학습 일지 작성
    async createStudyJournal(req, res) {
        try {
            const { userId, date, content, learnings, nextSteps } = req.body;

            const [result] = await db.execute(
                'INSERT INTO study_journals (user_id, date, content, learnings, next_steps) VALUES (?, ?, ?, ?, ?)',
                [userId, date, content, learnings, nextSteps]
            );

            res.status(201).json({
                success: true,
                journalId: result.insertId,
                message: '학습 일지가 저장되었습니다.'
            });
        } catch (error) {
            console.error('학습 일지 저장 오류:', error);
            res.status(500).json({
                success: false,
                message: '학습 일지 저장에 실패했습니다.'
            });
        }
    }

    // 개선 계획 수립
    async createImprovementPlan(req, res) {
        try {
            const { userId, goals, actions, timeline, metrics } = req.body;

            const [result] = await db.execute(
                'INSERT INTO improvement_plans (user_id, goals, actions, timeline, metrics) VALUES (?, ?, ?, ?, ?)',
                [userId, JSON.stringify(goals), JSON.stringify(actions), timeline, JSON.stringify(metrics)]
            );

            res.status(201).json({
                success: true,
                planId: result.insertId,
                message: '개선 계획이 저장되었습니다.'
            });
        } catch (error) {
            console.error('개선 계획 저장 오류:', error);
            res.status(500).json({
                success: false,
                message: '개선 계획 저장에 실패했습니다.'
            });
        }
    }
}

module.exports = new FeedbackController();