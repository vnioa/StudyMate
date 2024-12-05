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

    validateGoalData(goalData) {
        if (!goalData.title || goalData.title.length < 2 || goalData.title.length > 200) {
            throw new Error('제목은 2-200자 사이여야 합니다.');
        }

        if (!goalData.description || goalData.description.trim().length === 0) {
            throw new Error('설명은 필수입니다.');
        }

        if (new Date(goalData.deadline) <= new Date()) {
            throw new Error('마감기한은 현재 시간 이후여야 합니다.');
        }
    }
};

const goalController = {
    // 목표 생성
    createGoal: async (req, res) => {
        try {
            const userId = req.user.id;
            const { title, category, deadline, description } = req.body;

            utils.validateGoalData({ title, deadline, description });

            const result = await utils.executeTransaction(async (connection) => {
                const [goal] = await connection.execute(`
          INSERT INTO goals (memberId, title, category, deadline, description, status, createdAt)
          VALUES (?, ?, ?, ?, ?, 'active', NOW())
        `, [userId, title, category, deadline, description]);

                return { id: goal.insertId, title, category, deadline, description };
            });

            res.status(201).json({
                success: true,
                message: '목표가 성공적으로 생성되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('목표 생성 오류:', error);
            res.status(500).json({
                success: false,
                message: '목표 생성에 실패했습니다.'
            });
        }
    },

    // 목표 목록 조회
    getGoals: async (req, res) => {
        try {
            const userId = req.user.id;
            const { category, status, sort = 'createdAt' } = req.query;

            let query = `
        SELECT g.*, gp.progressValue, gp.note, gp.createdAt as lastUpdateAt
        FROM goals g
        LEFT JOIN goal_progress gp ON g.id = gp.goalId
        WHERE g.memberId = ?
      `;
            const params = [userId];

            if (category) {
                query += ' AND g.category = ?';
                params.push(category);
            }

            if (status) {
                query += ' AND g.status = ?';
                params.push(status);
            }

            query += ` ORDER BY g.${sort} DESC`;

            const goals = await utils.executeQuery(query, params);

            res.status(200).json({
                success: true,
                data: goals
            });
        } catch (error) {
            console.error('목표 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '목표 목록 조회에 실패했습니다.'
            });
        }
    },

    // 목표 상세 조회
    getGoalDetail: async (req, res) => {
        try {
            const userId = req.user.id;
            const { goalId } = req.params;

            const [goal] = await utils.executeQuery(`
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
      `, [goalId, userId]);

            if (!goal) {
                return res.status(404).json({
                    success: false,
                    message: '목표를 찾을 수 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                data: goal
            });
        } catch (error) {
            console.error('목표 상세 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '목표 상세 조회에 실패했습니다.'
            });
        }
    },

    // 목표 수정
    updateGoal: async (req, res) => {
        try {
            const userId = req.user.id;
            const { goalId } = req.params;
            const { title, deadline, description } = req.body;

            utils.validateGoalData({ title, deadline, description });

            const result = await utils.executeQuery(`
        UPDATE goals
        SET title = ?, deadline = ?, description = ?, updatedAt = NOW()
        WHERE id = ? AND memberId = ?
      `, [title, deadline, description, goalId, userId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '목표를 찾을 수 없거나 수정 권한이 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                message: '목표가 성공적으로 수정되었습니다.',
                data: { id: goalId, title, deadline, description }
            });
        } catch (error) {
            console.error('목표 수정 오류:', error);
            res.status(500).json({
                success: false,
                message: '목표 수정에 실패했습니다.'
            });
        }
    },

    // 목표 진행률 업데이트
    updateGoalProgress: async (req, res) => {
        try {
            const userId = req.user.id;
            const { goalId } = req.params;
            const { progress, note } = req.body;

            if (progress < 0 || progress > 100) {
                return res.status(400).json({
                    success: false,
                    message: '진행률은 0에서 100 사이여야 합니다.'
                });
            }

            const result = await utils.executeTransaction(async (connection) => {
                const [goal] = await connection.execute(
                    'SELECT * FROM goals WHERE id = ? AND memberId = ?',
                    [goalId, userId]
                );

                if (!goal) {
                    throw new Error('목표를 찾을 수 없습니다.');
                }

                await connection.execute(`
          INSERT INTO goal_progress (goalId, progressValue, note, createdAt)
          VALUES (?, ?, ?, NOW())
        `, [goalId, progress, note]);

                await connection.execute(`
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
            });

            res.status(200).json({
                success: true,
                message: '목표 진행률이 업데이트되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('목표 진행률 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '목표 진행률 업데이트에 실패했습니다.'
            });
        }
    },

    // 목표 상태 변경
    updateGoalStatus: async (req, res) => {
        try {
            const userId = req.user.id;
            const { goalId } = req.params;
            const { status } = req.body;

            const validStatuses = ['active', 'completed', 'cancelled', 'delayed'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 상태값입니다.'
                });
            }

            const result = await utils.executeQuery(`
        UPDATE goals
        SET status = ?, updatedAt = NOW()
        WHERE id = ? AND memberId = ?
      `, [status, goalId, userId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '목표를 찾을 수 없거나 수정 권한이 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                message: '목표 상태가 변경되었습니다.',
                data: { status }
            });
        } catch (error) {
            console.error('목표 상태 변경 오류:', error);
            res.status(500).json({
                success: false,
                message: '목표 상태 변경에 실패했습니다.'
            });
        }
    },

    // 목표 삭제
    deleteGoal: async (req, res) => {
        try {
            const userId = req.user.id;
            const { goalId } = req.params;

            const result = await utils.executeQuery(`
        UPDATE goals
        SET deletedAt = NOW()
        WHERE id = ? AND memberId = ?
      `, [goalId, userId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '목표를 찾을 수 없거나 삭제 권한이 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                message: '목표가 성공적으로 삭제되었습니다.'
            });
        } catch (error) {
            console.error('목표 삭제 오류:', error);
            res.status(500).json({
                success: false,
                message: '목표 삭제에 실패했습니다.'
            });
        }
    },

    // 목표 카테고리 목록 조회
    getCategories: async (req, res) => {
        try {
            const categories = await utils.executeQuery(
                'SELECT * FROM goal_categories WHERE deletedAt IS NULL'
            );

            res.status(200).json({
                success: true,
                data: categories
            });
        } catch (error) {
            console.error('목표 카테고리 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '목표 카테고리 목록 조회에 실패했습니다.'
            });
        }
    },

    // 목표 유효성 검사
    validateGoal: async (req, res) => {
        try {
            const { title, category, deadline, description } = req.body;

            utils.validateGoalData({ title, deadline, description });

            const validCategories = await utils.executeQuery(
                'SELECT id FROM goal_categories WHERE id = ? AND deletedAt IS NULL',
                [category]
            );

            if (!validCategories.length) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 카테고리입니다.'
                });
            }

            res.status(200).json({
                success: true,
                message: '유효한 목표입니다.'
            });
        } catch (error) {
            console.error('목표 유효성 검사 오류:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = goalController;