const db = require('../config/db');

// 업적 목록 조회
const getAchievements = async (req, res) => {
    try {
        const [achievements] = await db.execute(
            'SELECT * FROM achievements'
        );

        const [stats] = await db.execute(
            'SELECT COUNT(*) as acquired FROM user_achievements WHERE user_id = ?',
            [req.user.id]
        );

        res.status(200).json({
            achievements,
            stats: {
                acquired: stats[0].acquired,
                total: achievements.length
            }
        });
    } catch (error) {
        console.error('업적 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '업적 목록을 불러오는데 실패했습니다.'
        });
    }
};

// 업적 상세 조회
const getAchievementDetail = async (req, res) => {
    const { achievementId } = req.params;

    try {
        const [achievement] = await db.execute(
            'SELECT * FROM achievements WHERE achievement_id = ?',
            [achievementId]
        );

        if (achievement.length === 0) {
            return res.status(404).json({
                success: false,
                message: '해당 업적을 찾을 수 없습니다.'
            });
        }

        res.status(200).json({
            achievement: achievement[0]
        });
    } catch (error) {
        console.error('업적 상세 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '업적 정보를 불러오는데 실패했습니다.'
        });
    }
};

// 업적 진행도 업데이트
const updateProgress = async (req, res) => {
    const { achievementId } = req.params;
    const { progress } = req.body;

    try {
        await db.execute(
            'UPDATE user_achievements SET progress = ? WHERE user_id = ? AND achievement_id = ?',
            [progress, req.user.id, achievementId]
        );

        res.status(200).json({
            success: true,
            progress
        });
    } catch (error) {
        console.error('업적 진행도 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '업적 진행도 업데이트에 실패했습니다.'
        });
    }
};

// 업적 획득 처리
const acquireAchievement = async (req, res) => {
    const { achievementId } = req.params;

    try {
        const [result] = await db.execute(
            'INSERT INTO user_achievements (user_id, achievement_id, acquired_at) VALUES (?, ?, NOW())',
            [req.user.id, achievementId]
        );

        if (result.affectedRows > 0) {
            res.status(200).json({
                success: true,
                acquiredAt: new Date()
            });
        } else {
            throw new Error('업적 획득 처리 실패');
        }
    } catch (error) {
        console.error('업적 획득 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '업적 획득 처리에 실패했습니다.'
        });
    }
};

module.exports = {
    getAchievements,
    getAchievementDetail,
    updateProgress,
    acquireAchievement
};