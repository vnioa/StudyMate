const db = require('../config/mysql');
const createError = require('http-errors');

const GoalController = {
    // 목표 생성
    createGoal: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { title, category, deadline, description } = req.body;

            const [result] = await connection.query(
                `INSERT INTO goals
                     (user_id, title, category, deadline, description)
                 VALUES (?, ?, ?, ?, ?)`,
                [req.user.id, title, category, deadline, description]
            );

            res.json({ success: true, goalId: result.insertId });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 목표 목록 조회
    getGoals: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { category } = req.query;
            let query = 'SELECT * FROM goals WHERE user_id = ?';
            const params = [req.user.id];

            if (category) {
                query += ' AND category = ?';
                params.push(category);
            }

            query += ' ORDER BY created_at DESC';
            const [goals] = await connection.query(query, params);

            res.json({ goals });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 목표 상세 조회
    getGoalDetail: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { goalId } = req.params;
            const [goal] = await connection.query(
                'SELECT * FROM goals WHERE id = ? AND user_id = ?',
                [goalId, req.user.id]
            );

            if (!goal.length) {
                throw createError(404, '목표를 찾을 수 없습니다.');
            }

            res.json({ goal: goal[0] });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 목표 수정
    updateGoal: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { goalId } = req.params;
            const { title, deadline, description } = req.body;

            const [result] = await connection.query(
                `UPDATE goals
                 SET title = ?, deadline = ?, description = ?, updated_at = NOW()
                 WHERE id = ? AND user_id = ?`,
                [title, deadline, description, goalId, req.user.id]
            );

            if (result.affectedRows === 0) {
                throw createError(404, '목표를 찾을 수 없습니다.');
            }

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 목표 진행률 업데이트
    updateGoalProgress: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { goalId } = req.params;
            const { progress } = req.body;

            const [result] = await connection.query(
                `UPDATE goals
                 SET progress = ?, updated_at = NOW()
                 WHERE id = ? AND user_id = ?`,
                [progress, goalId, req.user.id]
            );

            if (result.affectedRows === 0) {
                throw createError(404, '목표를 찾을 수 없습니다.');
            }

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 목표 상태 변경
    updateGoalStatus: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { goalId } = req.params;
            const { status } = req.body;

            const [result] = await connection.query(
                `UPDATE goals
                 SET status = ?, updated_at = NOW()
                 WHERE id = ? AND user_id = ?`,
                [status, goalId, req.user.id]
            );

            if (result.affectedRows === 0) {
                throw createError(404, '목표를 찾을 수 없습니다.');
            }

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 목표 삭제
    deleteGoal: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { goalId } = req.params;
            const [result] = await connection.query(
                'DELETE FROM goals WHERE id = ? AND user_id = ?',
                [goalId, req.user.id]
            );

            if (result.affectedRows === 0) {
                throw createError(404, '목표를 찾을 수 없습니다.');
            }

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 목표 카테고리 목록 조회
    getCategories: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [categories] = await connection.query(
                'SELECT * FROM goal_categories WHERE is_active = true'
            );
            res.json({ categories });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 목표 유효성 검사
    validateGoal: async (req, res, next) => {
        try {
            const { title, category, deadline, description } = req.body;

            if (!title || title.length < 2) {
                return res.json({
                    isValid: false,
                    message: '제목은 2자 이상이어야 합니다.'
                });
            }

            if (!category) {
                return res.json({
                    isValid: false,
                    message: '카테고리를 선택해주세요.'
                });
            }

            if (!deadline) {
                return res.json({
                    isValid: false,
                    message: '목표 기한을 설정해주세요.'
                });
            }

            res.json({ isValid: true });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = GoalController;