const { dbUtils } = require('../db');

const achievementService = {
    // 업적 목록 조회
    async getAchievements() {
        try {
            const query = `
                SELECT a.*, ua.progress, ua.isAcquired, ua.acquiredAt
                FROM achievements a
                LEFT JOIN user_achievements ua ON a.id = ua.achievementId AND ua.userId = ?
                WHERE a.isHidden = false OR ua.isAcquired = true
                ORDER BY a.category, a.difficulty
            `;

            const achievements = await dbUtils.query(query, [req.user.id]);

            const stats = await dbUtils.query(`
                SELECT COUNT(*) as total,
                       SUM(CASE WHEN isAcquired = true THEN 1 ELSE 0 END) as acquired
                FROM user_achievements
                WHERE userId = ?
            `, [req.user.id]);

            return {
                achievements,
                stats: {
                    acquired: stats[0].acquired || 0,
                    total: stats[0].total || 0
                }
            };
        } catch (error) {
            throw new Error('업적 목록 조회 실패: ' + error.message);
        }
    },

    // 업적 상세 조회
    async getAchievementDetail(achievementId) {
        try {
            const query = `
                SELECT a.*, ua.progress, ua.isAcquired, ua.acquiredAt
                FROM achievements a
                LEFT JOIN user_achievements ua 
                    ON a.id = ua.achievementId AND ua.userId = ?
                WHERE a.id = ?
            `;

            const achievement = await dbUtils.query(query, [req.user.id, achievementId]);

            if (!achievement || achievement.length === 0) {
                throw new Error('업적을 찾을 수 없습니다.');
            }

            return { achievement: achievement[0] };
        } catch (error) {
            throw new Error('업적 상세 조회 실패: ' + error.message);
        }
    },

    // 업적 진행도 업데이트
    async updateProgress(achievementId, progress) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 업적 정보 조회
                const [achievement] = await connection.query(
                    'SELECT * FROM achievements WHERE id = ?',
                    [achievementId]
                );

                if (!achievement) {
                    throw new Error('업적을 찾을 수 없습니다.');
                }

                // 사용자 업적 진행도 업데이트
                const updateQuery = `
                    INSERT INTO user_achievements (userId, achievementId, progress)
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE progress = ?
                `;

                await connection.query(updateQuery, [
                    req.user.id,
                    achievementId,
                    progress,
                    progress
                ]);

                // 진행 이력 기록
                await connection.query(`
                    INSERT INTO achievement_history 
                    (userAchievementId, progressChange, action)
                    VALUES (?, ?, 'progress')
                `, [achievementId, progress]);

                return {
                    success: true,
                    progress
                };
            } catch (error) {
                throw new Error('진행도 업데이트 실패: ' + error.message);
            }
        });
    },

    // 업적 획득 처리
    async acquireAchievement(achievementId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 업적 획득 조건 확인
                const [userAchievement] = await connection.query(`
                    SELECT ua.*, a.requiredProgress
                    FROM user_achievements ua
                    JOIN achievements a ON ua.achievementId = a.id
                    WHERE ua.userId = ? AND ua.achievementId = ?
                `, [req.user.id, achievementId]);

                if (!userAchievement) {
                    throw new Error('업적 진행 정보를 찾을 수 없습니다.');
                }

                if (userAchievement.progress < userAchievement.requiredProgress) {
                    throw new Error('업적 획득 조건을 만족하지 않습니다.');
                }

                // 업적 획득 처리
                await connection.query(`
                    UPDATE user_achievements
                    SET isAcquired = true, acquiredAt = NOW()
                    WHERE userId = ? AND achievementId = ?
                `, [req.user.id, achievementId]);

                // 획득 이력 기록
                await connection.query(`
                    INSERT INTO achievement_history 
                    (userAchievementId, progressChange, action)
                    VALUES (?, ?, 'acquire')
                `, [userAchievement.id, userAchievement.progress]);

                return {
                    success: true,
                    acquiredAt: new Date()
                };
            } catch (error) {
                throw new Error('업적 획득 처리 실패: ' + error.message);
            }
        });
    }
};

module.exports = achievementService;