const db = require('../config/db');

// 유틸리티 함수
const utils = {
    async executeQuery(query, params) {
        try {
            const [results] = await db.execute(query, params);
            return results;
        } catch (error) {
            console.error('Query execution error:', error);
            throw new Error('데이터베이스 쿼리 실행 실패');
        }
    },

    async checkAchievementExists(achievementId, userId) {
        const achievement = await this.executeQuery(
            `SELECT a.*, ua.progress, ua.isAcquired 
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievementId AND ua.memberId = ?
       WHERE a.id = ?`,
            [userId, achievementId]
        );
        return achievement[0];
    }
};

const achievementController = {
    // 업적 목록 조회
    getAchievements: async (req, res) => {
        try {
            const { category, difficulty, isHidden } = req.query;
            const userId = req.user.id;

            let query = `
        SELECT a.*, ua.progress, ua.isAcquired, ua.acquiredAt
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.id = ua.achievementId AND ua.memberId = ?
        WHERE 1=1
      `;

            const params = [userId];

            if (category) {
                query += ' AND a.category = ?';
                params.push(category);
            }
            if (difficulty) {
                query += ' AND a.difficulty = ?';
                params.push(difficulty);
            }
            if (isHidden !== undefined) {
                query += ' AND a.isHidden = ?';
                params.push(isHidden === 'true');
            }

            const achievements = await utils.executeQuery(query, params);
            const stats = await utils.executeQuery(
                `SELECT COUNT(*) as total, 
         SUM(CASE WHEN isAcquired = true THEN 1 ELSE 0 END) as acquired
         FROM user_achievements WHERE memberId = ?`,
                [userId]
            );

            res.status(200).json({
                success: true,
                message: '업적 목록을 성공적으로 조회했습니다.',
                data: {
                    achievements,
                    stats: {
                        acquired: stats[0].acquired || 0,
                        total: stats[0].total || 0
                    }
                }
            });
        } catch (error) {
            console.error('업적 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '업적 목록 조회에 실패했습니다.'
            });
        }
    },

    // 업적 상세 조회
    getAchievementDetail: async (req, res) => {
        try {
            const { achievementId } = req.params;
            const userId = req.user.id;

            const achievement = await utils.checkAchievementExists(achievementId, userId);

            if (!achievement) {
                return res.status(404).json({
                    success: false,
                    message: '해당 업적을 찾을 수 없습니다.'
                });
            }

            const history = await utils.executeQuery(
                `SELECT * FROM achievement_history 
         WHERE userAchievementId IN (
           SELECT id FROM user_achievements 
           WHERE memberId = ? AND achievementId = ?
         )`,
                [userId, achievementId]
            );

            achievement.history = history;

            res.status(200).json({
                success: true,
                message: '업적 상세 정보를 성공적으로 조회했습니다.',
                data: achievement
            });
        } catch (error) {
            console.error('업적 상세 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '업적 상세 조회에 실패했습니다.'
            });
        }
    },

    // 업적 진행도 업데이트
    updateProgress: async (req, res) => {
        try {
            const { achievementId } = req.params;
            const { progress } = req.body;
            const userId = req.user.id;

            if (typeof progress !== 'number' || progress < 0) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 진행도입니다.'
                });
            }

            const achievement = await utils.checkAchievementExists(achievementId, userId);

            if (!achievement) {
                return res.status(404).json({
                    success: false,
                    message: '해당 업적을 찾을 수 없습니다.'
                });
            }

            await utils.executeQuery(
                `INSERT INTO user_achievements (memberId, achievementId, progress)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE progress = ?`,
                [userId, achievementId, progress, progress]
            );

            res.status(200).json({
                success: true,
                message: '업적 진행도가 성공적으로 업데이트되었습니다.',
                data: { progress }
            });
        } catch (error) {
            console.error('진행도 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '진행도 업데이트에 실패했습니다.'
            });
        }
    },

    // 업적 획득 처리
    acquireAchievement: async (req, res) => {
        try {
            const { achievementId } = req.params;
            const userId = req.user.id;

            const achievement = await utils.checkAchievementExists(achievementId, userId);

            if (!achievement) {
                return res.status(404).json({
                    success: false,
                    message: '해당 업적을 찾을 수 없습니다.'
                });
            }

            if (achievement.progress < achievement.requiredProgress) {
                return res.status(400).json({
                    success: false,
                    message: '업적 획득 조건이 충족되지 않았습니다.'
                });
            }

            await utils.executeQuery(
                `UPDATE user_achievements 
         SET isAcquired = true, acquiredAt = NOW()
         WHERE memberId = ? AND achievementId = ?`,
                [userId, achievementId]
            );

            res.status(200).json({
                success: true,
                message: '업적을 성공적으로 획득했습니다.',
                data: { acquiredAt: new Date() }
            });
        } catch (error) {
            console.error('업적 획득 처리 오류:', error);
            res.status(500).json({
                success: false,
                message: '업적 획득 처리에 실패했습니다.'
            });
        }
    }
};

module.exports = achievementController;