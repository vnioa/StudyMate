const db = require('../config/mysql');

class DashboardService {
    // 오늘의 학습 요약 조회
    async getDailySummary(userId) {
        try {
            // 오늘의 학습 시간
            const [studyTime] = await db.execute(
                `SELECT SUM(duration) as total_time
                 FROM study_sessions
                 WHERE user_id = ? AND DATE(created_at) = CURDATE()`,
                [userId]
            );

            // 완료된 목표
            const [completedGoals] = await db.execute(
                `SELECT COUNT(*) as count
                 FROM study_goals
                 WHERE user_id = ? AND completed = true
                   AND DATE(completed_at) = CURDATE()`,
                [userId]
            );

            return {
                totalStudyTime: studyTime[0].total_time || 0,
                completedGoals: completedGoals[0].count
            };
        } catch (error) {
            console.error('일일 요약 조회 오류:', error);
            throw new Error('일일 요약 조회에 실패했습니다.');
        }
    }

    // 주간/월간 학습 통계
    async getPeriodStats(userId, period) {
        try {
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
                 GROUP BY DATE(created_at)`,
                [userId]
            );

            return stats;
        } catch (error) {
            console.error('기간별 통계 조회 오류:', error);
            throw new Error('기간별 통계 조회에 실패했습니다.');
        }
    }

    // 학습 스트릭 조회
    async getStudyStreak(userId) {
        try {
            const [streak] = await db.execute(
                'SELECT streak_count, last_study_date FROM user_streaks WHERE user_id = ?',
                [userId]
            );

            return streak[0] || { streak_count: 0, last_study_date: null };
        } catch (error) {
            console.error('스트릭 조회 오류:', error);
            throw new Error('스트릭 조회에 실패했습니다.');
        }
    }

    // 성취 뱃지 조회
    async getAchievements(userId) {
        try {
            const [achievements] = await db.execute(
                'SELECT * FROM user_achievements WHERE user_id = ? ORDER BY earned_at DESC',
                [userId]
            );

            return achievements;
        } catch (error) {
            console.error('성취 조회 오류:', error);
            throw new Error('성취 조회에 실패했습니다.');
        }
    }

    // 다가오는 일정 조회
    async getUpcomingEvents(userId) {
        try {
            const [events] = await db.execute(
                `SELECT * FROM study_schedules
                 WHERE user_id = ? AND start_time > NOW()
                 ORDER BY start_time
                     LIMIT 5`,
                [userId]
            );

            return events;
        } catch (error) {
            console.error('일정 조회 오류:', error);
            throw new Error('일정 조회에 실패했습니다.');
        }
    }
}

module.exports = new DashboardService();