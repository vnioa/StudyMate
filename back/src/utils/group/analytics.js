const db = require('../../config/mysql');

class GroupAnalytics {
    // 학습 시간 통계 계산
    calculateStudyTimeStats(studySessions) {
        const totalTime = studySessions.reduce((sum, session) => sum + session.duration, 0);
        const averageTime = totalTime / studySessions.length || 0;

        return {
            total: totalTime,
            average: averageTime
        };
    }

    // 참여율 계산
    calculateParticipationRate(totalMembers, activeMembers) {
        return (activeMembers / totalMembers) * 100;
    }

    // 목표 달성률 계산
    calculateGoalAchievement(target, achieved) {
        return (achieved / target) * 100;
    }

    // 퀴즈 성과 분석
    analyzeQuizPerformance(quizResults) {
        const totalScore = quizResults.reduce((sum, result) => sum + result.score, 0);
        const averageScore = totalScore / quizResults.length || 0;

        return {
            average: averageScore,
            highest: Math.max(...quizResults.map(r => r.score)),
            lowest: Math.min(...quizResults.map(r => r.score))
        };
    }

    // 활동 트렌드 분석
    async analyzeActivityTrends(groupId, startDate, endDate) {
        try {
            const [activities] = await db.execute(
                `SELECT DATE(created_at) as date,
                     COUNT(DISTINCT user_id) as active_users,
                     COUNT(*) as activity_count
                 FROM group_activities
                 WHERE group_id = ?
                   AND created_at BETWEEN ? AND ?
                 GROUP BY DATE(created_at)`,
                [groupId, startDate, endDate]
            );

            return activities;
        } catch (error) {
            console.error('활동 트렌드 분석 오류:', error);
            throw error;
        }
    }

    // 멤버별 기여도 계산
    async calculateMemberContributions(groupId) {
        try {
            const [contributions] = await db.execute(
                `SELECT
                     user_id,
                     COUNT(CASE WHEN type = 'material' THEN 1 END) as material_count,
                     COUNT(CASE WHEN type = 'quiz' THEN 1 END) as quiz_count,
                     COUNT(CASE WHEN type = 'discussion' THEN 1 END) as discussion_count
                 FROM group_activities
                 WHERE group_id = ?
                 GROUP BY user_id`,
                [groupId]
            );

            return contributions;
        } catch (error) {
            console.error('멤버 기여도 계산 오류:', error);
            throw error;
        }
    }

    // 학습 진도율 계산
    calculateProgressRate(completedUnits, totalUnits) {
        return (completedUnits / totalUnits) * 100;
    }
}

module.exports = new GroupAnalytics();