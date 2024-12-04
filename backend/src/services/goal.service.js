const { dbUtils } = require('../config/db');

const goalService = {
    // 목표 생성
    async createGoal(goalData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [result] = await connection.query(`
                    INSERT INTO goals (
                        memberId, title, category, deadline,
                        description, status, createdAt
                    ) VALUES (?, ?, ?, ?, ?, 'active', NOW())
                `, [
                    goalData.memberId,
                    goalData.title,
                    goalData.category,
                    goalData.deadline,
                    goalData.description
                ]);

                return { id: result.insertId, ...goalData };
            } catch (error) {
                throw new Error('목표 생성 실패: ' + error.message);
            }
        });
    },

    // 목표 목록 조회
    async getGoals(userId, options = {}) {
        try {
            let query = `
                SELECT g.*, gp.progressValue, gp.note, gp.createdAt as lastUpdateAt
                FROM goals g
                LEFT JOIN goal_progress gp ON g.id = gp.goalId
                WHERE g.memberId = ?
            `;

            const params = [userId];

            if (options.category) {
                query += ' AND g.category = ?';
                params.push(options.category);
            }

            if (options.status) {
                query += ' AND g.status = ?';
                params.push(options.status);
            }

            query += ` ORDER BY g.${options.sort || 'createdAt'} DESC`;

            return await dbUtils.query(query, params);
        } catch (error) {
            throw new Error('목표 목록 조회 실패: ' + error.message);
        }
    },

    // 목표 상세 조회
    async getGoalDetail(goalId, userId) {
        try {
            const query = `
                SELECT g.*,
                       JSON_ARRAYAGG(
                               JSON_OBJECT(
                                       'id', gp.id,
                                       'progressValue', gp.progressValue,
                                       'note', gp.note,
                                       'createdAt', gp.createdAt
                               )
                       ) as progressHistory
                FROM goals g
                         LEFT JOIN goal_progress gp ON g.id = gp.goalId
                WHERE g.id = ? AND g.memberId = ?
                GROUP BY g.id
            `;

            const [goal] = await dbUtils.query(query, [goalId, userId]);
            if (!goal) {
                throw new Error('목표를 찾을 수 없습니다.');
            }

            return goal;
        } catch (error) {
            throw new Error('목표 상세 조회 실패: ' + error.message);
        }
    },

    // 목표 수정
    async updateGoal(goalId, userId, updateData) {
        try {
            const result = await dbUtils.query(`
                UPDATE goals
                SET title = ?, deadline = ?, description = ?, updatedAt = NOW()
                WHERE id = ? AND memberId = ?
            `, [
                updateData.title,
                updateData.deadline,
                updateData.description,
                goalId,
                userId
            ]);

            if (result.affectedRows === 0) {
                throw new Error('목표를 찾을 수 없거나 수정 권한이 없습니다.');
            }

            return { id: goalId, ...updateData };
        } catch (error) {
            throw new Error('목표 수정 실패: ' + error.message);
        }
    },

    // 목표 진행률 업데이트
    async updateGoalProgress(goalId, userId, progress, note) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [goal] = await connection.query(
                    'SELECT * FROM goals WHERE id = ? AND memberId = ?',
                    [goalId, userId]
                );

                if (!goal) {
                    throw new Error('목표를 찾을 수 없습니다.');
                }

                await connection.query(`
                    INSERT INTO goal_progress (
                        goalId, progressValue, note, createdAt
                    ) VALUES (?, ?, ?, NOW())
                `, [goalId, progress, note]);

                await connection.query(`
                    UPDATE goals
                    SET progress = ?,
                        status = CASE 
                            WHEN ? >= 100 THEN 'completed'
                            ELSE status
                        END,
                        updatedAt = NOW()
                    WHERE id = ?
                `, [progress, progress, goalId]);

                return { progress, note };
            } catch (error) {
                throw new Error('목표 진행률 업데이트 실패: ' + error.message);
            }
        });
    },

    // 목표 상태 변경
    async updateGoalStatus(goalId, userId, status) {
        try {
            const result = await dbUtils.query(`
                UPDATE goals
                SET status = ?, updatedAt = NOW()
                WHERE id = ? AND memberId = ?
            `, [status, goalId, userId]);

            if (result.affectedRows === 0) {
                throw new Error('목표를 찾을 수 없거나 수정 권한이 없습니다.');
            }

            return { status };
        } catch (error) {
            throw new Error('목표 상태 변경 실패: ' + error.message);
        }
    },

    // 목표 삭제
    async deleteGoal(goalId, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const result = await connection.query(`
                    UPDATE goals
                    SET deletedAt = NOW()
                    WHERE id = ? AND memberId = ?
                `, [goalId, userId]);

                if (result.affectedRows === 0) {
                    throw new Error('목표를 찾을 수 없거나 삭제 권한이 없습니다.');
                }
            } catch (error) {
                throw new Error('목표 삭제 실패: ' + error.message);
            }
        });
    },

    // 목표 카테고리 목록 조회
    async getGoalCategories() {
        try {
            return await dbUtils.query(
                'SELECT * FROM goal_categories WHERE deletedAt IS NULL'
            );
        } catch (error) {
            throw new Error('목표 카테고리 목록 조회 실패: ' + error.message);
        }
    },

    // 목표 유효성 검사
    async validateGoal(goalData) {
        try {
            if (!goalData.title || goalData.title.length < 2 || goalData.title.length > 200) {
                throw new Error('제목은 2-200자 사이여야 합니다.');
            }

            if (!goalData.description || goalData.description.trim().length === 0) {
                throw new Error('설명은 필수입니다.');
            }

            if (new Date(goalData.deadline) <= new Date()) {
                throw new Error('마감기한은 현재 시간 이후여야 합니다.');
            }

            return true;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = goalService;