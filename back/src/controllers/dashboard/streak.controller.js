const db = require('../../config/mysql');

class StreakController {
    // 스트릭 업데이트
    async updateStreak(req, res) {
        try {
            const { userId } = req.params;
            const today = new Date();

            const [currentStreak] = await db.execute(
                'SELECT streak_count, last_study_date FROM user_streaks WHERE user_id = ?',
                [userId]
            );

            const lastStudyDate = currentStreak[0]?.last_study_date;
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

    // 스트릭 프리즈 사용
    async useStreakFreeze(req, res) {
        try {
            const { userId } = req.params;

            const [freezeCount] = await db.execute(
                'SELECT freeze_count FROM user_streaks WHERE user_id = ?',
                [userId]
            );

            if (!freezeCount[0] || freezeCount[0].freeze_count < 1) {
                return res.status(400).json({
                    success: false,
                    message: '사용 가능한 스트릭 프리즈가 없습니다.'
                });
            }

            await db.execute(
                'UPDATE user_streaks SET freeze_count = freeze_count - 1, last_study_date = NOW() WHERE user_id = ?',
                [userId]
            );

            res.status(200).json({
                success: true,
                message: '스트릭 프리즈가 적용되었습니다.'
            });
        } catch (error) {
            console.error('스트릭 프리즈 사용 오류:', error);
            res.status(500).json({
                success: false,
                message: '스트릭 프리즈 사용에 실패했습니다.'
            });
        }
    }

    // 스트릭 상태 조회
    async getStreakStatus(req, res) {
        try {
            const { userId } = req.params;

            const [streak] = await db.execute(
                'SELECT streak_count, last_study_date, freeze_count FROM user_streaks WHERE user_id = ?',
                [userId]
            );

            if (streak.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '스트릭 정보가 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                streak: streak[0]
            });
        } catch (error) {
            console.error('스트릭 상태 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '스트릭 상태 조회에 실패했습니다.'
            });
        }
    }
}

module.exports = new StreakController();