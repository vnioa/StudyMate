const { Level, LevelRequirement, ExperienceLog } = require('../models');
const { dbUtils } = require('../config/db');

const levelService = {
    // 레벨 정보 조회
    async getLevelInfo(userId) {
        try {
            const query = `
                SELECT l.*, lr.requiredXP, lr.description, lr.rewards
                FROM levels l
                LEFT JOIN level_requirements lr ON l.currentLevel = lr.level
                WHERE l.userId = ?
            `;
            const [levelInfo] = await dbUtils.query(query, [userId]);

            if (!levelInfo) {
                throw new Error('레벨 정보를 찾을 수 없습니다');
            }

            return { levelInfo };
        } catch (error) {
            throw new Error('레벨 정보 조회 실패: ' + error.message);
        }
    },

    // 레벨 통계 조회
    async getLevelStats(userId) {
        try {
            const query = `
                SELECT 
                    l.*,
                    COUNT(DISTINCT el.id) as totalActivities,
                    SUM(el.amount) as totalEarnedXP
                FROM levels l
                LEFT JOIN experience_logs el ON l.userId = el.userId
                WHERE l.userId = ?
                GROUP BY l.id
            `;
            const [stats] = await dbUtils.query(query, [userId]);

            const recentLogs = await dbUtils.query(`
                SELECT * FROM experience_logs
                WHERE userId = ?
                ORDER BY createdAt DESC
                LIMIT 10
            `, [userId]);

            return {
                stats,
                recentActivities: recentLogs
            };
        } catch (error) {
            throw new Error('레벨 통계 조회 실패: ' + error.message);
        }
    },

    // 레벨 달성 조건 조회
    async getLevelRequirements() {
        try {
            const query = `
                SELECT * FROM level_requirements
                ORDER BY level ASC
            `;
            const requirements = await dbUtils.query(query);
            return { requirements };
        } catch (error) {
            throw new Error('레벨 달성 조건 조회 실패: ' + error.message);
        }
    },

    // 경험치 획득
    async gainExperience(userId, data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const { amount, type, description } = data;

                // 현재 레벨 정보 조회
                const [level] = await connection.query(`
                    SELECT * FROM levels WHERE userId = ?
                `, [userId]);

                if (!level) {
                    throw new Error('사용자 레벨 정보를 찾을 수 없습니다');
                }

                // 레벨업 체크
                const [requirement] = await connection.query(`
                    SELECT * FROM level_requirements 
                    WHERE level = ?
                `, [level.currentLevel]);

                const newCurrentXP = level.currentXP + amount;
                const newTotalXP = level.totalXP + amount;
                let newLevel = level.currentLevel;
                let levelUpOccurred = false;

                if (requirement && newCurrentXP >= requirement.requiredXP) {
                    newLevel += 1;
                    levelUpOccurred = true;
                }

                // 연속 학습일 체크
                const lastActivity = level.lastActivityDate;
                const today = new Date();
                let newStreak = level.studyStreak;

                if (!lastActivity) {
                    newStreak = 1;
                } else {
                    const diffDays = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
                    if (diffDays === 1) {
                        newStreak += 1;
                    } else if (diffDays > 1) {
                        newStreak = 1;
                    }
                }

                // 레벨 정보 업데이트
                await connection.query(`
                    UPDATE levels 
                    SET currentLevel = ?,
                        currentXP = ?,
                        totalXP = ?,
                        studyStreak = ?,
                        lastActivityDate = NOW()
                    WHERE userId = ?
                `, [
                    newLevel,
                    levelUpOccurred ? newCurrentXP - requirement.requiredXP : newCurrentXP,
                    newTotalXP,
                    newStreak,
                    userId
                ]);

                // 경험치 로그 기록
                await connection.query(`
                    INSERT INTO experience_logs 
                    (userId, amount, type, description, levelUpOccurred)
                    VALUES (?, ?, ?, ?, ?)
                `, [userId, amount, type, description, levelUpOccurred]);

                return {
                    success: true,
                    levelUp: levelUpOccurred,
                    newLevel,
                    currentXP: levelUpOccurred ? newCurrentXP - requirement.requiredXP : newCurrentXP,
                    totalXP: newTotalXP,
                    studyStreak: newStreak
                };
            } catch (error) {
                throw new Error('경험치 획득 처리 실패: ' + error.message);
            }
        });
    }
};

module.exports = levelService;