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

    async executeTransaction(callback) {
        let connection;
        try {
            connection = await db.getConnection();
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    },

    validateExperienceType(type) {
        const validTypes = ['study', 'achievement', 'quest', 'activity'];
        return validTypes.includes(type);
    }
};

const levelController = {
    // 레벨 정보 조회
    getLevelInfo: async (req, res) => {
        try {
            const userId = req.user.id;

            const [levelInfo] = await utils.executeQuery(`
        SELECT l.*, 
               lr.requiredXP as nextLevelXP,
               lr.description as nextLevelDescription,
               lr.rewards as nextLevelRewards
        FROM levels l
        LEFT JOIN level_requirements lr ON lr.level = l.currentLevel + 1
        WHERE l.memberId = ?
      `, [userId]);

            if (!levelInfo) {
                return res.status(404).json({
                    success: false,
                    message: '레벨 정보를 찾을 수 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                message: '레벨 정보를 성공적으로 조회했습니다.',
                data: levelInfo
            });
        } catch (error) {
            console.error('레벨 정보 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '레벨 정보 조회에 실패했습니다.'
            });
        }
    },

    // 레벨 통계 조회
    getLevelStats: async (req, res) => {
        try {
            const userId = req.user.id;

            const [stats] = await utils.executeQuery(`
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
      `, [userId]);

            res.status(200).json({
                success: true,
                message: '레벨 통계를 성공적으로 조회했습니다.',
                data: stats
            });
        } catch (error) {
            console.error('레벨 통계 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '레벨 통계 조회에 실패했습니다.'
            });
        }
    },

    // 레벨 달성 조건 조회
    getLevelRequirements: async (req, res) => {
        try {
            const { level } = req.query;

            const [requirements] = await utils.executeQuery(`
        SELECT *
        FROM level_requirements
        WHERE level = ?
      `, [level]);

            if (!requirements) {
                return res.status(404).json({
                    success: false,
                    message: '레벨 요구사항을 찾을 수 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                message: '레벨 달성 조건을 성공적으로 조회했습니다.',
                data: requirements
            });
        } catch (error) {
            console.error('레벨 달성 조건 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '레벨 달성 조건 조회에 실패했습니다.'
            });
        }
    },

    // 경험치 획득
    gainExperience: async (req, res) => {
        try {
            const userId = req.user.id;
            const { amount, type, description } = req.body;

            if (!utils.validateExperienceType(type)) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 경험치 획득 유형입니다.'
                });
            }

            if (amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: '경험치는 0보다 커야 합니다.'
                });
            }

            const result = await utils.executeTransaction(async (connection) => {
                const [currentLevel] = await connection.execute(
                    'SELECT * FROM levels WHERE memberId = ?',
                    [userId]
                );

                if (!currentLevel) {
                    throw new Error('레벨 정보를 찾을 수 없습니다.');
                }

                const newTotalXP = currentLevel.totalXP + amount;
                const newCurrentXP = currentLevel.currentXP + amount;

                const [nextLevelReq] = await connection.execute(`
          SELECT * FROM level_requirements 
          WHERE level = ? AND requiredXP <= ?
          ORDER BY level DESC LIMIT 1
        `, [currentLevel.currentLevel + 1, newCurrentXP]);

                const levelUpOccurred = !!nextLevelReq;
                const previousLevel = currentLevel.currentLevel;
                const newLevel = levelUpOccurred ? nextLevelReq.level : currentLevel.currentLevel;

                await connection.execute(`
          INSERT INTO experience_logs (
            memberId, amount, type, description,
            levelUpOccurred, previousLevel, newLevel,
            createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [userId, amount, type, description, levelUpOccurred, previousLevel, newLevel]);

                await connection.execute(`
          UPDATE levels
          SET currentLevel = ?,
              currentXP = ?,
              totalXP = ?,
              lastActivityDate = NOW()
          WHERE memberId = ?
        `, [newLevel, newCurrentXP, newTotalXP, userId]);

                return {
                    levelUpOccurred,
                    previousLevel,
                    newLevel,
                    currentXP: newCurrentXP,
                    totalXP: newTotalXP
                };
            });

            res.status(200).json({
                success: true,
                message: '경험치가 성공적으로 획득되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('경험치 획득 오류:', error);
            res.status(500).json({
                success: false,
                message: '경험치 획득에 실패했습니다.'
            });
        }
    }
};

module.exports = levelController;