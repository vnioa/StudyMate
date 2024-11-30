const db = require('../config/mysql');
const createError = require('http-errors');

const AchievementController = {
    // 업적 목록 조회
    getAchievements: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [[achievements], [stats]] = await Promise.all([
                connection.query(
                    `SELECT a.*,
                            (SELECT COUNT(*) FROM user_achievements ua
                             WHERE ua.achievement_id = a.id AND ua.user_id = ?) as is_acquired,
                            (SELECT progress FROM user_achievements ua
                             WHERE ua.achievement_id = a.id AND ua.user_id = ?) as current_progress
                     FROM achievements a
                     WHERE a.is_active = true
                     ORDER BY a.display_order ASC`,
                    [req.user.id, req.user.id]
                ),
                connection.query(
                    `SELECT
                         COUNT(*) as total,
                         COUNT(ua.id) as acquired
                     FROM achievements a
                              LEFT JOIN user_achievements ua
                                        ON a.id = ua.achievement_id AND ua.user_id = ?
                     WHERE a.is_active = true`,
                    [req.user.id]
                )
            ]);

            res.json({
                achievements,
                stats: {
                    acquired: stats[0].acquired,
                    total: stats[0].total
                }
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 업적 상세 조회
    getAchievementDetail: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { achievementId } = req.params;

            const [achievement] = await connection.query(
                `SELECT a.*,
                        (SELECT progress FROM user_achievements
                         WHERE achievement_id = a.id AND user_id = ?) as current_progress,
                        (SELECT acquired_at FROM user_achievements
                         WHERE achievement_id = a.id AND user_id = ?) as acquired_at
                 FROM achievements a
                 WHERE a.id = ? AND a.is_active = true`,
                [req.user.id, req.user.id, achievementId]
            );

            if (!achievement.length) {
                throw createError(404, '업적을 찾을 수 없습니다.');
            }

            res.json({ achievement: achievement[0] });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 업적 진행도 업데이트
    updateProgress: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { achievementId } = req.params;
            const { progress } = req.body;

            await connection.beginTransaction();

            const [achievement] = await connection.query(
                'SELECT * FROM achievements WHERE id = ? AND is_active = true',
                [achievementId]
            );

            if (!achievement.length) {
                throw createError(404, '업적을 찾을 수 없습니다.');
            }

            const [result] = await connection.query(
                `INSERT INTO user_achievements (user_id, achievement_id, progress)
                 VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE progress = ?`,
                [req.user.id, achievementId, progress, progress]
            );

            // 진행도가 100%에 도달하면 자동으로 업적 획득 처리
            if (progress >= 100) {
                await connection.query(
                    `UPDATE user_achievements
                     SET acquired_at = NOW()
                     WHERE user_id = ? AND achievement_id = ? AND acquired_at IS NULL`,
                    [req.user.id, achievementId]
                );
            }

            await connection.commit();
            res.json({
                success: true,
                progress
            });
        } catch (err) {
            await connection.rollback();
            next(err);
        } finally {
            connection.release();
        }
    },

    // 업적 획득 처리
    acquireAchievement: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { achievementId } = req.params;

            await connection.beginTransaction();

            const [achievement] = await connection.query(
                'SELECT * FROM achievements WHERE id = ? AND is_active = true',
                [achievementId]
            );

            if (!achievement.length) {
                throw createError(404, '업적을 찾을 수 없습니다.');
            }

            const [existing] = await connection.query(
                'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
                [req.user.id, achievementId]
            );

            if (existing.length && existing[0].acquired_at) {
                throw createError(400, '이미 획득한 업적입니다.');
            }

            const now = new Date();
            await connection.query(
                `INSERT INTO user_achievements (user_id, achievement_id, progress, acquired_at)
                 VALUES (?, ?, 100, ?)
                     ON DUPLICATE KEY UPDATE progress = 100, acquired_at = ?`,
                [req.user.id, achievementId, now, now]
            );

            await connection.commit();
            res.json({
                success: true,
                acquiredAt: now
            });
        } catch (err) {
            await connection.rollback();
            next(err);
        } finally {
            connection.release();
        }
    }
};

module.exports = AchievementController;