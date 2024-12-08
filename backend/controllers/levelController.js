const db = require('../config/db');

// 레벨 정보 조회
const getLevelInfo = async (req, res) => {
    try {
        const [result] = await db.execute(
            'SELECT current_level, current_xp, next_level_xp FROM user_levels WHERE user_id = ?',
            [req.user.id]
        );

        if (result.length === 0) {
            return res.status(200).json({
                currentLevel: 1,
                currentXP: 0,
                nextLevelXP: 100
            });
        }

        res.status(200).json({
            currentLevel: result[0].current_level,
            currentXP: result[0].current_xp,
            nextLevelXP: result[0].next_level_xp
        });
    } catch (error) {
        console.error('레벨 정보 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '레벨 정보를 불러오는데 실패했습니다.'
        });
    }
};

// 레벨 통계 조회
const getLevelStats = async (req, res) => {
    try {
        const [result] = await db.execute(
            'SELECT total_xp, study_streak FROM user_levels WHERE user_id = ?',
            [req.user.id]
        );

        if (result.length === 0) {
            return res.status(200).json({
                totalXP: 0,
                studyStreak: 0
            });
        }

        res.status(200).json({
            totalXP: result[0].total_xp,
            studyStreak: result[0].study_streak
        });
    } catch (error) {
        console.error('레벨 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '레벨 통계를 불러오는데 실패했습니다.'
        });
    }
};

// 레벨 달성 조건 조회
const getLevelRequirements = async (req, res) => {
    try {
        const [requirements] = await db.execute(
            'SELECT * FROM level_requirements ORDER BY level'
        );
        res.status(200).json({ requirements });
    } catch (error) {
        console.error('레벨 달성 조건 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '레벨 달성 조건을 불러오는데 실패했습니다.'
        });
    }
};

// 경험치 획득
const gainExperience = async (req, res) => {
    const { amount, type } = req.body;
    try {
        const [currentLevel] = await db.execute(
            'SELECT current_level, current_xp, next_level_xp FROM user_levels WHERE user_id = ?',
            [req.user.id]
        );

        let newXP = (currentLevel[0]?.current_xp || 0) + amount;
        let levelUp = false;

        if (currentLevel[0] && newXP >= currentLevel[0].next_level_xp) {
            levelUp = true;
            await db.execute(
                'UPDATE user_levels SET current_level = current_level + 1, current_xp = ?, next_level_xp = next_level_xp * 1.5 WHERE user_id = ?',
                [newXP - currentLevel[0].next_level_xp, req.user.id]
            );
        } else {
            await db.execute(
                'INSERT INTO user_levels (user_id, current_xp) VALUES (?, ?) ON DUPLICATE KEY UPDATE current_xp = ?',
                [req.user.id, newXP, newXP]
            );
        }

        res.status(200).json({
            success: true,
            newXP,
            levelUp
        });
    } catch (error) {
        console.error('경험치 획득 오류:', error);
        res.status(500).json({
            success: false,
            message: '경험치 획득에 실패했습니다.'
        });
    }
};

module.exports = {
    getLevelInfo,
    getLevelStats,
    getLevelRequirements,
    gainExperience
};