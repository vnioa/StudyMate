const db = require('../config/db');

// 목표 생성
const createGoal = async (req, res) => {
    const { title, category, deadline, description } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO goals (user_id, title, category, deadline, description) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, title, category, deadline, description]
        );
        res.status(201).json({
            success: true,
            goalId: result.insertId
        });
    } catch (error) {
        console.error('목표 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '목표 생성에 실패했습니다.'
        });
    }
};

// 목표 목록 조회
const getGoals = async (req, res) => {
    const { category } = req.query;
    try {
        let query = 'SELECT * FROM goals WHERE user_id = ?';
        const params = [req.user.id];

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        const [goals] = await db.execute(query, params);
        res.status(200).json({ goals });
    } catch (error) {
        console.error('목표 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '목표 목록을 불러오는데 실패했습니다.'
        });
    }
};

// 목표 상세 조회
const getGoalDetail = async (req, res) => {
    const { goalId } = req.params;
    try {
        const [goal] = await db.execute(
            'SELECT * FROM goals WHERE goal_id = ? AND user_id = ?',
            [goalId, req.user.id]
        );

        if (goal.length === 0) {
            return res.status(404).json({
                success: false,
                message: '목표를 찾을 수 없습니다.'
            });
        }

        res.status(200).json({ goal: goal[0] });
    } catch (error) {
        console.error('목표 상세 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '목표 정보를 불러오는데 실패했습니다.'
        });
    }
};

// 목표 수정
const updateGoal = async (req, res) => {
    const { goalId } = req.params;
    const { title, deadline, description } = req.body;
    try {
        await db.execute(
            'UPDATE goals SET title = ?, deadline = ?, description = ? WHERE goal_id = ? AND user_id = ?',
            [title, deadline, description, goalId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('목표 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: '목표 수정에 실패했습니다.'
        });
    }
};

// 목표 진행률 업데이트
const updateGoalProgress = async (req, res) => {
    const { goalId } = req.params;
    const { progress } = req.body;
    try {
        await db.execute(
            'UPDATE goals SET progress = ? WHERE goal_id = ? AND user_id = ?',
            [progress, goalId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('목표 진행률 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '목표 진행률 업데이트에 실패했습니다.'
        });
    }
};

// 목표 상태 변경
const updateGoalStatus = async (req, res) => {
    const { goalId } = req.params;
    const { status } = req.body;
    try {
        await db.execute(
            'UPDATE goals SET status = ? WHERE goal_id = ? AND user_id = ?',
            [status, goalId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('목표 상태 변경 오류:', error);
        res.status(500).json({
            success: false,
            message: '목표 상태 변경에 실패했습니다.'
        });
    }
};

// 목표 삭제
const deleteGoal = async (req, res) => {
    const { goalId } = req.params;
    try {
        await db.execute(
            'DELETE FROM goals WHERE goal_id = ? AND user_id = ?',
            [goalId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('목표 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '목표 삭제에 실패했습니다.'
        });
    }
};

// 목표 카테고리 목록 조회
const getCategories = async (req, res) => {
    try {
        const [categories] = await db.execute('SELECT * FROM goal_categories');
        res.status(200).json({ categories });
    } catch (error) {
        console.error('카테고리 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '카테고리 목록을 불러오는데 실패했습니다.'
        });
    }
};

// 목표 유효성 검사
const validateGoal = async (req, res) => {
    const { title, category, deadline, description } = req.body;
    try {
        const errors = [];

        if (!title || title.length < 2) {
            errors.push('제목은 2자 이상이어야 합니다.');
        }

        if (!category) {
            errors.push('카테고리를 선택해주세요.');
        }

        if (!deadline) {
            errors.push('마감일을 설정해주세요.');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                isValid: false,
                message: errors.join('\n')
            });
        }

        res.status(200).json({
            isValid: true
        });
    } catch (error) {
        console.error('목표 유효성 검사 오류:', error);
        res.status(500).json({
            isValid: false,
            message: '유효성 검사에 실패했습니다.'
        });
    }
};

module.exports = {
    createGoal,
    getGoals,
    getGoalDetail,
    updateGoal,
    updateGoalProgress,
    updateGoalStatus,
    deleteGoal,
    getCategories,
    validateGoal
};