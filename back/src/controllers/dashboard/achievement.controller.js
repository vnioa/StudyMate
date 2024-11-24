const db = require('../config/mysql');

class AchievementController {
    // 성취 뱃지 획득
    async earnBadge(req, res) {
        try {
            const { userId, badgeType, achievementData } = req.body;

            const [result] = await db.execute(
                'INSERT INTO user_achievements (user_id, badge_type, achievement_data) VALUES (?, ?, ?)',
                [userId, badgeType, JSON.stringify(achievementData)]
            );

            // 사용자 포인트 업데이트
            await db.execute(
                'UPDATE users SET points = points + ? WHERE id = ?',
                [achievementData.points, userId]
            );

            res.status(201).json({
                success: true,
                achievementId: result.insertId,
                message: '새로운 뱃지를 획득했습니다.'
            });
        } catch (error) {
            console.error('뱃지 획득 오류:', error);
            res.status(500).json({
                success: false,
                message: '뱃지 획득에 실패했습니다.'
            });
        }
    }

    // 학습 스트릭 업데이트
    async updateStreak(req, res) {
        try {
            const { userId } = req.params;

            const [currentStreak] = await db.execute(
                'SELECT streak_count, last_study_date FROM user_streaks WHERE user_id = ?',
                [userId]
            );

            const lastStudyDate = currentStreak[0]?.last_study_date;
            const today = new Date();

            let newStreakCount = 1;
            if (lastStudyDate) {
                const dayDiff = Math.floor((today - new Date(lastStudyDate)) / (1000 * 60 * 60 * 24));
                if (dayDiff === 1) {
                    newStreakCount = currentStreak[0].streak_count + 1;
                }
            }

            await db.execute(
                'INSERT INTO user_streaks (user_id, streak_count, last_study_date) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE streak_count = ?, last_study_date = NOW()',
                [userId, newStreakCount, newStreakCount]
            );

            res.status(200).json({
                success: true,
                streakCount: newStreakCount
            });
        } catch (error) {
            console.error('스트릭 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '스트릭 업데이트에 실패했습니다.'
            });
        }
    }

    // 레벨 업데이트
    async updateLevel(req, res) {
        try {
            const { userId } = req.params;

            const [userPoints] = await db.execute(
                'SELECT points FROM users WHERE id = ?',
                [userId]
            );

            const newLevel = Math.floor(userPoints[0].points / 1000) + 1;

            await db.execute(
                'UPDATE users SET level = ? WHERE id = ?',
                [newLevel, userId]
            );

            res.status(200).json({
                success: true,
                level: newLevel,
                message: `레벨 ${newLevel}로 상승했습니다!`
            });
        } catch (error) {
            console.error('레벨 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '레벨 업데이트에 실패했습니다.'
            });
        }
    }

    // 성취 목록 조회
    async getAchievements(req, res) {
        try {
            const { userId } = req.params;

            const [achievements] = await db.execute(
                'SELECT * FROM user_achievements WHERE user_id = ? ORDER BY earned_at DESC',
                [userId]
            );

            res.status(200).json({
                success: true,
                achievements
            });
        } catch (error) {
            console.error('성취 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '성취 목록 조회에 실패했습니다.'
            });
        }
    }
}

module.exports = new AchievementController();