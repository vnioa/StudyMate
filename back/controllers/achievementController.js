// controllers/achievementController.js
const db = require('../config/db');

exports.getAchievements = async (req, res) => {
    const userId = req.user.id;
    try {
        const [achievements] = await db.execute(
            'SELECT * FROM user_achievements WHERE user_id = ?',
            [userId]
        );
        const [badges] = await db.execute(
            'SELECT * FROM badges WHERE id IN (SELECT badge_id FROM user_badges WHERE user_id = ?)',
            [userId]
        );
        const [level] = await db.execute(
            'SELECT level, experience FROM user_levels WHERE user_id = ?',
            [userId]
        );

        res.status(200).json({
            success: true,
            achievements,
            badges,
            level: level[0] || { level: 1, experience: 0 }
        });
    } catch (error) {
        console.error('성취 데이터 조회 오류:', error);
        res.status(500).json({ success: false, message: '성취 데이터 조회에 실패했습니다.' });
    }
};

exports.updateAchievement = async (req, res) => {
    const userId = req.user.id;
    const { achievementId, progress } = req.body;
    try {
        await db.execute(
            'UPDATE user_achievements SET progress = ? WHERE user_id = ? AND achievement_id = ?',
            [progress, userId, achievementId]
        );

        // 업적 완료 체크 및 보상 지급 로직
        const [achievement] = await db.execute(
            'SELECT * FROM achievements WHERE id = ?',
            [achievementId]
        );
        if (progress >= achievement[0].target_value) {
            await db.execute(
                'INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE badge_id = badge_id',
                [userId, achievement[0].badge_id]
            );

            // 경험치 지급
            await db.execute(
                'UPDATE user_levels SET experience = experience + ? WHERE user_id = ?',
                [achievement[0].exp_reward, userId]
            );

            // 레벨업 체크
            const [userLevel] = await db.execute(
                'SELECT * FROM user_levels WHERE user_id = ?',
                [userId]
            );
            if (userLevel[0].experience >= userLevel[0].level * 100) {
                await db.execute(
                    'UPDATE user_levels SET level = level + 1, experience = experience - ? WHERE user_id = ?',
                    [userLevel[0].level * 100, userId]
                );
            }
        }

        res.status(200).json({ success: true, message: '성취 업데이트 완료' });
    } catch (error) {
        console.error('성취 업데이트 오류:', error);
        res.status(500).json({ success: false, message: '성취 업데이트에 실패했습니다.' });
    }
};

exports.getLeaderboard = async (req, res) => {
    try {
        const [leaderboard] = await db.execute(
            'SELECT u.username, ul.level, ul.experience FROM user_levels ul JOIN users u ON ul.user_id = u.id ORDER BY ul.level DESC, ul.experience DESC LIMIT 10'
        );
        res.status(200).json({ success: true, leaderboard });
    } catch (error) {
        console.error('리더보드 조회 오류:', error);
        res.status(500).json({ success: false, message: '리더보드 조회에 실패했습니다.' });
    }
};