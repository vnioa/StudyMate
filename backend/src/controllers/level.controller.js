const db = require('../config/mysql');
const createError = require('http-errors');

const LevelController = {
    // 레벨 정보 조회
    getLevelInfo: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [userLevel] = await connection.query(
                `SELECT current_level, current_xp, 
         (SELECT required_xp FROM level_requirements WHERE level = current_level + 1) as next_level_xp
         FROM user_levels 
         WHERE user_id = ?`,
                [req.user.id]
            );

            if (!userLevel.length) {
                throw createError(404, '레벨 정보를 찾을 수 없습니다.');
            }

            res.json({
                currentLevel: userLevel[0].current_level,
                currentXP: userLevel[0].current_xp,
                nextLevelXP: userLevel[0].next_level_xp
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 레벨 통계 조회
    getLevelStats: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [[stats], [streak]] = await Promise.all([
                connection.query(
                    'SELECT total_xp FROM user_levels WHERE user_id = ?',
                    [req.user.id]
                ),
                connection.query(
                    'SELECT current_streak as study_streak FROM study_streaks WHERE user_id = ? AND is_active = true',
                    [req.user.id]
                )
            ]);

            res.json({
                totalXP: stats?.total_xp || 0,
                studyStreak: streak?.study_streak || 0
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 레벨 달성 조건 조회
    getLevelRequirements: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [requirements] = await connection.query(
                'SELECT level, required_xp, rewards FROM level_requirements ORDER BY level'
            );

            res.json({ requirements });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 경험치 획득
    gainExperience: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { amount, type } = req.body;

            await connection.beginTransaction();

            // 현재 레벨 정보 조회
            const [currentLevel] = await connection.query(
                'SELECT current_level, current_xp, total_xp FROM user_levels WHERE user_id = ?',
                [req.user.id]
            );

            if (!currentLevel.length) {
                throw createError(404, '사용자 레벨 정보를 찾을 수 없습니다.');
            }

            const newTotalXP = currentLevel[0].total_xp + amount;
            let newCurrentXP = currentLevel[0].current_xp + amount;
            let newLevel = currentLevel[0].current_level;
            let levelUp = false;

            // 레벨업 체크
            const [nextLevelReq] = await connection.query(
                'SELECT required_xp FROM level_requirements WHERE level = ?',
                [newLevel + 1]
            );

            if (nextLevelReq.length && newCurrentXP >= nextLevelReq[0].required_xp) {
                newLevel += 1;
                newCurrentXP -= nextLevelReq[0].required_xp;
                levelUp = true;
            }

            // 경험치 업데이트
            await connection.query(
                `UPDATE user_levels 
         SET current_level = ?, current_xp = ?, total_xp = ?
         WHERE user_id = ?`,
                [newLevel, newCurrentXP, newTotalXP, req.user.id]
            );

            // 경험치 획득 이력 저장
            await connection.query(
                'INSERT INTO xp_history (user_id, amount, type, created_at) VALUES (?, ?, ?, NOW())',
                [req.user.id, amount, type]
            );

            await connection.commit();
            res.json({
                success: true,
                newXP: newCurrentXP,
                levelUp
            });
        } catch (err) {
            await connection.rollback();
            next(err);
        } finally {
            connection.release();
        }
    }
};

module.exports = LevelController;