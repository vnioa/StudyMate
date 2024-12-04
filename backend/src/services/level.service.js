const { dbUtils } = require('../config/db');

const levelService = {
    // 레벨 정보 조회
    async getLevelInfo(userId) {
        try {
            const query = `
                SELECT l.*, 
                       lr.requiredXP as nextLevelXP,
                       lr.description as nextLevelDescription,
                       lr.rewards as nextLevelRewards
                FROM levels l
                LEFT JOIN level_requirements lr ON lr.level = l.currentLevel + 1
                WHERE l.memberId = ?
            `;

            const [levelInfo] = await dbUtils.query(query, [userId]);
            if (!levelInfo) {
                throw new Error('레벨 정보를 찾을 수 없습니다.');
            }

            return levelInfo;
        } catch (error) {
            throw new Error('레벨 정보 조회 실패: ' + error.message);
        }
    },

    // 레벨 통계 조회
    async getLevelStats(userId) {
        try {
            const query = `
                SELECT 
                    l.currentLevel,
                    l.totalXP,
                    l.studyStreak,
                    l.maxStreak,
                    COUNT(DISTINCT CASE WHEN el.type = 'study' THEN DATE(el.createdAt) END) as totalStudyDays,
                    COUNT(DISTINCT CASE WHEN el.levelUpOccurred = true THEN el.id END) as totalLevelUps,
                    SUM(CASE WHEN el.type = 'achievement' THEN el.amount ELSE 0 END) as achievementXP,
                    SUM(CASE WHEN el.type = 'study' THEN el.amount ELSE 0 END) as studyXP
                FROM levels l
                LEFT JOIN experience_logs el ON l.memberId = el.memberId
                WHERE l.memberId = ?
                GROUP BY l.memberId
            `;

            const [stats] = await dbUtils.query(query, [userId]);
            return stats;
        } catch (error) {
            throw new Error('레벨 통계 조회 실패: ' + error.message);
        }
    },

    // 레벨 달성 조건 조회
    async getLevelRequirements(level) {
        try {
            const query = `
                SELECT *
                FROM level_requirements
                WHERE level = ?
            `;

            const [requirements] = await dbUtils.query(query, [level]);
            if (!requirements) {
                throw new Error('레벨 요구사항을 찾을 수 없습니다.');
            }

            return requirements;
        } catch (error) {
            throw new Error('레벨 달성 조건 조회 실패: ' + error.message);
        }
    },

    // 경험치 획득
    async gainExperience(expData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 현재 레벨 정보 조회
                const [currentLevel] = await connection.query(`
                    SELECT * FROM levels WHERE memberId = ?
                `, [expData.memberId]);

                if (!currentLevel) {
                    throw new Error('레벨 정보를 찾을 수 없습니다.');
                }

                // 새로운 총 경험치 계산
                const newTotalXP = currentLevel.totalXP + expData.amount;
                const newCurrentXP = currentLevel.currentXP + expData.amount;

                // 레벨업 체크
                const [nextLevelReq] = await connection.query(`
                    SELECT * FROM level_requirements 
                    WHERE level = ? AND requiredXP <= ?
                    ORDER BY level DESC LIMIT 1
                `, [currentLevel.currentLevel + 1, newCurrentXP]);

                let levelUpOccurred = false;
                let previousLevel = currentLevel.currentLevel;
                let newLevel = currentLevel.currentLevel;

                if (nextLevelReq) {
                    levelUpOccurred = true;
                    newLevel = nextLevelReq.level;
                }

                // 경험치 로그 기록
                await connection.query(`
                    INSERT INTO experience_logs (
                        memberId, amount, type, description,
                        levelUpOccurred, previousLevel, newLevel,
                        createdAt
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                `, [
                    expData.memberId,
                    expData.amount,
                    expData.type,
                    expData.description,
                    levelUpOccurred,
                    previousLevel,
                    newLevel
                ]);

                // 레벨 정보 업데이트
                await connection.query(`
                    UPDATE levels
                    SET currentLevel = ?,
                        currentXP = ?,
                        totalXP = ?,
                        lastActivityDate = NOW()
                    WHERE memberId = ?
                `, [
                    newLevel,
                    newCurrentXP,
                    newTotalXP,
                    expData.memberId
                ]);

                return {
                    levelUpOccurred,
                    previousLevel,
                    newLevel,
                    currentXP: newCurrentXP,
                    totalXP: newTotalXP
                };
            } catch (error) {
                throw new Error('경험치 획득 처리 실패: ' + error.message);
            }
        });
    }
};

module.exports = levelService;