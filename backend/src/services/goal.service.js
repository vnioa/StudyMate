const { dbUtils } = require('../config/db');

const goalService = {
    // 목표 생성
    async createGoal(data) {
        try {
            const query = `
                INSERT INTO goals (
                    userId, title, category, deadline, 
                    description, status, progress
                ) VALUES (?, ?, ?, ?, ?, 'active', 0)
            `;

            const result = await dbUtils.query(query, [
                req.user.id,
                data.title,
                data.category,
                data.deadline,
                data.description
            ]);

            return {
                success: true,
                goalId: result.insertId
            };
        } catch (error) {
            throw new Error('목표 생성 실패: ' + error.message);
        }
    },

    // 목표 목록 조회
    async getGoals(params) {
        try {
            const { category } = params;
            let query = `
                SELECT g.*, 
                       COUNT(DISTINCT s.id) as subGoalCount,
                       COUNT(DISTINCT c.id) as completedSubGoalCount
                FROM goals g
                LEFT JOIN sub_goals s ON g.id = s.goalId
                LEFT JOIN sub_goals c ON g.id = c.goalId AND c.status = 'completed'
                WHERE g.userId = ?
            `;

            const queryParams = [req.user.id];

            if (category) {
                query += ' AND g.category = ?';
                queryParams.push(category);
            }

            query += ' GROUP BY g.id ORDER BY g.createdAt DESC';

            const goals = await dbUtils.query(query, queryParams);
            return { goals };
        } catch (error) {
            throw new Error('목표 목록 조회 실패: ' + error.message);
        }
    },

    // 목표 상세 조회
    async getGoalDetail(goalId) {
        try {
            const query = `
                SELECT g.*, 
                       COUNT(DISTINCT s.id) as subGoalCount,
                       COUNT(DISTINCT c.id) as completedSubGoalCount
                FROM goals g
                LEFT JOIN sub_goals s ON g.id = s.goalId
                LEFT JOIN sub_goals c ON g.id = c.goalId AND c.status = 'completed'
                WHERE g.id = ? AND g.userId = ?
                GROUP BY g.id
            `;

            const [goal] = await dbUtils.query(query, [goalId, req.user.id]);

            if (!goal) {
                throw new Error('목표를 찾을 수 없습니다');
            }

            return { goal };
        } catch (error) {
            throw new Error('목표 상세 조회 실패: ' + error.message);
        }
    },

    // 목표 수정
    async updateGoal(goalId, data) {
        try {
            const query = `
                UPDATE goals 
                SET title = ?,
                    deadline = ?,
                    description = ?
                WHERE id = ? AND userId = ?
            `;

            const result = await dbUtils.query(query, [
                data.title,
                data.deadline,
                data.description,
                goalId,
                req.user.id
            ]);

            if (result.affectedRows === 0) {
                throw new Error('목표를 찾을 수 없습니다');
            }

            return { success: true };
        } catch (error) {
            throw new Error('목표 수정 실패: ' + error.message);
        }
    },

    // 목표 진행률 업데이트
    async updateGoalProgress(goalId, data) {
        try {
            const query = `
                UPDATE goals 
                SET progress = ?
                WHERE id = ? AND userId = ?
            `;

            const result = await dbUtils.query(query, [
                data.progress,
                goalId,
                req.user.id
            ]);

            if (result.affectedRows === 0) {
                throw new Error('목표를 찾을 수 없습니다');
            }

            return {
                success: true,
                progress: data.progress
            };
        } catch (error) {
            throw new Error('목표 진행률 업데이트 실패: ' + error.message);
        }
    },

    // 목표 상태 변경
    async updateGoalStatus(goalId, status) {
        try {
            const query = `
                UPDATE goals 
                SET status = ?
                WHERE id = ? AND userId = ?
            `;

            const result = await dbUtils.query(query, [
                status,
                goalId,
                req.user.id
            ]);

            if (result.affectedRows === 0) {
                throw new Error('목표를 찾을 수 없습니다');
            }

            return { success: true };
        } catch (error) {
            throw new Error('목표 상태 변경 실패: ' + error.message);
        }
    },

    // 목표 삭제
    async deleteGoal(goalId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 하위 목표 삭제
                await connection.query(
                    'DELETE FROM sub_goals WHERE goalId = ?',
                    [goalId]
                );

                // 목표 삭제
                const result = await connection.query(
                    'DELETE FROM goals WHERE id = ? AND userId = ?',
                    [goalId, req.user.id]
                );

                if (result.affectedRows === 0) {
                    throw new Error('목표를 찾을 수 없습니다');
                }

                return { success: true };
            } catch (error) {
                throw new Error('목표 삭제 실패: ' + error.message);
            }
        });
    },

    // 목표 카테고리 목록 조회
    async getCategories() {
        try {
            const categories = await dbUtils.query(
                'SELECT DISTINCT category FROM goals WHERE userId = ?',
                [req.user.id]
            );
            return { categories };
        } catch (error) {
            throw new Error('카테고리 목록 조회 실패: ' + error.message);
        }
    },

    // 목표 유효성 검사
    async validateGoal(data) {
        try {
            if (!data.title || data.title.length < 2) {
                throw new Error('제목은 2자 이상이어야 합니다');
            }

            if (!data.deadline || new Date(data.deadline) < new Date()) {
                throw new Error('마감일은 현재 날짜 이후여야 합니다');
            }

            return { success: true };
        } catch (error) {
            throw new Error('목표 유효성 검사 실패: ' + error.message);
        }
    }
};

module.exports = goalService;