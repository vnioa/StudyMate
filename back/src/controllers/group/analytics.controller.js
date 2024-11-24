const db = require('../../config/mysql');

class AnalyticsController {
    // 그룹 전체 학습 통계 조회
    async getGroupAnalytics(req, res) {
        try {
            const { groupId } = req.params;

            // 전체 학습 시간 통계
            const [totalStudyTime] = await db.execute(
                'SELECT SUM(duration) as total FROM study_sessions WHERE group_id = ?',
                [groupId]
            );

            // 과목별 학습 시간
            const [subjectStats] = await db.execute(
                'SELECT subject, SUM(duration) as duration FROM study_sessions WHERE group_id = ? GROUP BY subject',
                [groupId]
            );

            // 멤버별 참여율
            const [memberParticipation] = await db.execute(
                `SELECT u.name, COUNT(s.id) as session_count, SUM(s.duration) as total_duration 
         FROM users u 
         LEFT JOIN study_sessions s ON u.id = s.user_id 
         WHERE s.group_id = ? 
         GROUP BY u.id`,
                [groupId]
            );

            res.status(200).json({
                success: true,
                data: {
                    totalStudyTime: totalStudyTime[0].total,
                    subjectStats,
                    memberParticipation
                }
            });
        } catch (error) {
            console.error('그룹 통계 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '그룹 통계 조회에 실패했습니다.'
            });
        }
    }

    // 개인별 학습 성과 분석
    async getMemberAnalytics(req, res) {
        try {
            const { groupId, userId } = req.params;

            // 개인 학습 시간 추이
            const [studyTrend] = await db.execute(
                `SELECT DATE(created_at) as date, SUM(duration) as duration 
         FROM study_sessions 
         WHERE group_id = ? AND user_id = ? 
         GROUP BY DATE(created_at) 
         ORDER BY date DESC 
         LIMIT 30`,
                [groupId, userId]
            );

            // 목표 달성률
            const [goals] = await db.execute(
                `SELECT g.target, SUM(s.duration) as achieved 
         FROM group_goals g 
         LEFT JOIN study_sessions s ON g.group_id = s.group_id 
         WHERE g.group_id = ? AND s.user_id = ? 
         GROUP BY g.id`,
                [groupId, userId]
            );

            res.status(200).json({
                success: true,
                data: {
                    studyTrend,
                    goals
                }
            });
        } catch (error) {
            console.error('멤버 분석 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '멤버 분석 조회에 실패했습니다.'
            });
        }
    }

    // 퀴즈 성과 분석
    async getQuizAnalytics(req, res) {
        try {
            const { groupId } = req.params;

            // 퀴즈별 평균 점수
            const [quizScores] = await db.execute(
                `SELECT q.title, AVG(qr.score) as avg_score, COUNT(qr.id) as attempt_count 
         FROM group_quizzes q 
         LEFT JOIN quiz_results qr ON q.id = qr.quiz_id 
         WHERE q.group_id = ? 
         GROUP BY q.id`,
                [groupId]
            );

            // 멤버별 퀴즈 성과
            const [memberScores] = await db.execute(
                `SELECT u.name, AVG(qr.score) as avg_score, COUNT(qr.id) as quiz_count 
         FROM users u 
         JOIN quiz_results qr ON u.id = qr.user_id 
         WHERE qr.group_id = ? 
         GROUP BY u.id`,
                [groupId]
            );

            res.status(200).json({
                success: true,
                data: {
                    quizScores,
                    memberScores
                }
            });
        } catch (error) {
            console.error('퀴즈 분석 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '퀴즈 분석 조회에 실패했습니다.'
            });
        }
    }

    // 그룹 활동 트렌드 분석
    async getActivityTrends(req, res) {
        try {
            const { groupId } = req.params;

            // 일별 활동량 추이
            const [dailyActivity] = await db.execute(
                `SELECT DATE(created_at) as date, 
                COUNT(DISTINCT user_id) as active_users,
                COUNT(*) as activity_count
         FROM group_activities 
         WHERE group_id = ? 
         GROUP BY DATE(created_at) 
         ORDER BY date DESC 
         LIMIT 30`,
                [groupId]
            );

            // 시간대별 활동 분포
            const [hourlyDistribution] = await db.execute(
                `SELECT HOUR(created_at) as hour, 
                COUNT(*) as activity_count 
         FROM group_activities 
         WHERE group_id = ? 
         GROUP BY HOUR(created_at)`,
                [groupId]
            );

            res.status(200).json({
                success: true,
                data: {
                    dailyActivity,
                    hourlyDistribution
                }
            });
        } catch (error) {
            console.error('활동 트렌드 분석 오류:', error);
            res.status(500).json({
                success: false,
                message: '활동 트렌드 분석에 실패했습니다.'
            });
        }
    }
}

module.exports = new AnalyticsController();