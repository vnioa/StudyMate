const { dbUtils } = require('../config/db');

const achievementService = {
    // 업적 목록 조회
    async getAchievements(userId, options = {}) {
        try {
            const { category, difficulty, isHidden } = options;

            const query = `
                SELECT a.*, ua.progress, ua.isAcquired, ua.acquiredAt
                FROM achievements a
                LEFT JOIN user_achievements ua 
                    ON a.id = ua.achievementId AND ua.memberId = ?
                WHERE 1=1
                ${category ? 'AND a.category = ?' : ''}
                ${difficulty ? 'AND a.difficulty = ?' : ''}
                ${isHidden !== undefined ? 'AND a.isHidden = ?' : ''}
                ORDER BY a.category, a.difficulty
            `;

            const params = [userId];
            if (category) params.push(category);
            if (difficulty) params.push(difficulty);
            if (isHidden !== undefined) params.push(isHidden);

            const achievements = await dbUtils.query(query, params);

            const statsQuery = `
                SELECT COUNT(*) as total,
                       SUM(CASE WHEN isAcquired = true THEN 1 ELSE 0 END) as acquired
                FROM user_achievements
                WHERE memberId = ?
            `;

            const [stats] = await dbUtils.query(statsQuery, [userId]);

            return {
                achievements,
                stats: {
                    acquired: stats.acquired || 0,
                    total: stats.total || 0
                }
            };
        } catch (error) {
            throw new Error('업적 목록 조회 실패: ' + error.message);
        }
    },

    // 업적 상세 조회
    async getAchievementDetail(achievementId, userId) {
        try {
            const query = `
                SELECT a.*, ua.progress, ua.isAcquired, ua.acquiredAt,
                       JSON_ARRAYAGG(
                           JSON_OBJECT(
                               'id', ah.id,
                               'progressChange', ah.progressChange,
                               'action', ah.action,
                               'createdAt', ah.createdAt
                           )
                       ) as history
                FROM achievements a
                LEFT JOIN user_achievements ua 
                    ON a.id = ua.achievementId AND ua.memberId = ?
                LEFT JOIN achievement_history ah 
                    ON ua.id = ah.userAchievementId
                WHERE a.id = ?
                GROUP BY a.id, ua.id
            `;

            const [achievement] = await dbUtils.query(query, [userId, achievementId]);

            if (!achievement) {
                throw new Error('업적을 찾을 수 없습니다.');
            }

            return achievement;
        } catch (error) {
            throw new Error('업적 상세 조회 실패: ' + error.message);
        }
    },

    // 업적 진행도 업데이트
    async updateProgress(achievementId, userId, progress) {
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
                    INSERT INTO user_achievements (memberId, achievementId, progress)
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE progress = ?
                `;

                await connection.query(updateQuery, [
                    userId,
                    achievementId,
                    progress,
                    progress
                ]);

                // 진행 이력 기록
                const [userAchievement] = await connection.query(
                    'SELECT id FROM user_achievements WHERE memberId = ? AND achievementId = ?',
                    [userId, achievementId]
                );

                await connection.query(`
                    INSERT INTO achievement_history 
                    (userAchievementId, progressChange, action)
                    VALUES (?, ?, 'progress')
                `, [userAchievement.id, progress]);

                return { success: true, progress };
            } catch (error) {
                throw new Error('진행도 업데이트 실패: ' + error.message);
            }
        });
    },

    // 업적 획득 처리
    async acquireAchievement(achievementId, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 업적 획득 조건 확인
                const [userAchievement] = await connection.query(`
                    SELECT ua.*, a.requiredProgress
                    FROM user_achievements ua
                    JOIN achievements a ON ua.achievementId = a.id
                    WHERE ua.memberId = ? AND ua.achievementId = ?
                `, [userId, achievementId]);

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
                    WHERE memberId = ? AND achievementId = ?
                `, [userId, achievementId]);

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