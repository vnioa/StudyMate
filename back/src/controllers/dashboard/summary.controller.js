const db = require('../../config/mysql');

class SummaryController {
    // 오늘의 학습 요약 조회
    async getDailySummary(req, res) {
        try {
            const { userId } = req.params;
            const today = new Date().toISOString().split('T')[0];

            // 오늘의 학습 시간
            const [studyTime] = await db.execute(
                `SELECT SUM(duration) as total_time
                 FROM study_sessions
                 WHERE user_id = ? AND DATE(created_at) = ?`,
                [userId, today]
            );

            // 오늘의 완료된 목표
            const [completedGoals] = await db.execute(
                `SELECT COUNT(*) as count
                 FROM study_goals
                 WHERE user_id = ? AND completed = true AND DATE(completed_at) = ?`,
                [userId, today]
            );

            // 오늘의 학습 세션
            const [sessions] = await db.execute(
                `SELECT * FROM study_sessions
                 WHERE user_id = ? AND DATE(created_at) = ?
                 ORDER BY created_at DESC`,
                [userId, today]
            );

            res.status(200).json({
                success: true,
                summary: {
                    totalStudyTime: studyTime[0].total_time || 0,
                    completedGoals: completedGoals[0].count,
                    sessions
                }
            });
        } catch (error) {
            console.error('일일 요약 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '일일 요약 조회에 실패했습니다.'
            });
        }
    }

    // 주간/월간 학습 통계 조회
    async getPeriodStats(req, res) {
        try {
            const { userId } = req.params;
            const { period } = req.query; // 'week' or 'month'

            let dateQuery = '';
            if (period === 'week') {
                dateQuery = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
            } else if (period === 'month') {
                dateQuery = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
            }

            const [stats] = await db.execute(
                `SELECT
                     DATE(created_at) as date,
                     SUM(duration) as total_time,
                     COUNT(*) as session_count
                 FROM study_sessions
                 WHERE user_id = ? ${dateQuery}
                 GROUP BY DATE(created_at)
                 ORDER BY date`,
                [userId]
            );

            res.status(200).json({
                success: true,
                stats
            });
        } catch (error) {
            console.error('기간별 통계 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '기간별 통계 조회에 실패했습니다.'
            });
        }
    }

    // 다가오는 일정 조회
    async getUpcomingEvents(req, res) {
        try {
            const { userId } = req.params;

            const [events] = await db.execute(
                `SELECT * FROM study_schedules
                 WHERE user_id = ? AND start_time > NOW()
                 ORDER BY start_time
                     LIMIT 5`,
                [userId]
            );

            res.status(200).json({
                success: true,
                events
            });
        } catch (error) {
            console.error('일정 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '일정 조회에 실패했습니다.'
            });
        }
    }
}

module.exports = new SummaryController();