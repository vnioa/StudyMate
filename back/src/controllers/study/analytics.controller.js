const db = require('../config/mysql');

class AnalyticsController {
    // 학습 통계 조회
    async getStudyAnalytics(req, res) {
        try {
            const { userId } = req.params;
            const { period } = req.query;

            // 기간별 학습 시간 통계
            const [studyTime] = await db.execute(
                `SELECT DATE(created_at) as date, SUM(duration) as total_time
                 FROM study_sessions
                 WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                 GROUP BY DATE(created_at)`,
                [userId, period || 30]
            );

            // 과목별 학습 시간
            const [subjectStats] = await db.execute(
                `SELECT subject, SUM(duration) as total_time
                 FROM study_sessions
                 WHERE user_id = ?
                 GROUP BY subject`,
                [userId]
            );

            res.status(200).json({
                success: true,
                analytics: {
                    studyTime,
                    subjectStats
                }
            });
        } catch (error) {
            console.error('학습 통계 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '학습 통계 조회에 실패했습니다.'
            });
        }
    }

    // 목표 달성률 분석
    async getGoalAnalytics(req, res) {
        try {
            const { userId } = req.params;

            const [goalStats] = await db.execute(
                `SELECT
                     COUNT(*) as total_goals,
                     COUNT(CASE WHEN completed = true THEN 1 END) as completed_goals,
                     AVG(CASE WHEN completed = true THEN progress ELSE NULL END) as avg_progress
                 FROM study_goals
                 WHERE user_id = ?`,
                [userId]
            );

            res.status(200).json({
                success: true,
                goalStats: goalStats[0]
            });
        } catch (error) {
            console.error('목표 분석 오류:', error);
            res.status(500).json({
                success: false,
                message: '목표 분석에 실패했습니다.'
            });
        }
    }

    // 학습 패턴 분석
    async getStudyPatterns(req, res) {
        try {
            const { userId } = req.params;

            // 시간대별 학습 분포
            const [hourlyPattern] = await db.execute(
                `SELECT HOUR(created_at) as hour,
                     COUNT(*) as session_count,
                     AVG(duration) as avg_duration
                 FROM study_sessions
                 WHERE user_id = ?
                 GROUP BY HOUR(created_at)`,
                [userId]
            );

            res.status(200).json({
                success: true,
                patterns: {
                    hourlyPattern
                }
            });
        } catch (error) {
            console.error('학습 패턴 분석 오류:', error);
            res.status(500).json({
                success: false,
                message: '학습 패턴 분석에 실패했습니다.'
            });
        }
    }

    // 성과 비교 분석
    async getPerformanceComparison(req, res) {
        try {
            const { userId } = req.params;

            // 개인 성과와 전체 평균 비교
            const [comparison] = await db.execute(
                `SELECT
                     AVG(CASE WHEN user_id = ? THEN duration END) as user_avg,
                     AVG(duration) as total_avg
                 FROM study_sessions`,
                [userId]
            );

            res.status(200).json({
                success: true,
                comparison: comparison[0]
            });
        } catch (error) {
            console.error('성과 비교 분석 오류:', error);
            res.status(500).json({
                success: false,
                message: '성과 비교 분석에 실패했습니다.'
            });
        }
    }
}

module.exports = new AnalyticsController();