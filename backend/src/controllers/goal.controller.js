const goalService = require('../services/goal.service');

const goalController = {
    // 목표 생성
    createGoal: async (req, res) => {
        try {
            const result = await goalService.createGoal(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 목표 목록 조회
    getGoals: async (req, res) => {
        try {
            const result = await goalService.getGoals(req.query);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 목표 상세 조회
    getGoalDetail: async (req, res) => {
        try {
            const result = await goalService.getGoalDetail(req.params.goalId);
            res.json(result);
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    },

    // 목표 수정
    updateGoal: async (req, res) => {
        try {
            const result = await goalService.updateGoal(req.params.goalId, req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 목표 진행률 업데이트
    updateGoalProgress: async (req, res) => {
        try {
            const result = await goalService.updateGoalProgress(req.params.goalId, req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 목표 상태 변경
    updateGoalStatus: async (req, res) => {
        try {
            const result = await goalService.updateGoalStatus(req.params.goalId, req.body.status);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 목표 삭제
    deleteGoal: async (req, res) => {
        try {
            const result = await goalService.deleteGoal(req.params.goalId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 목표 카테고리 목록 조회
    getCategories: async (req, res) => {
        try {
            const result = await goalService.getCategories();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 목표 유효성 검사
    validateGoal: async (req, res) => {
        try {
            const result = await goalService.validateGoal(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = goalController;