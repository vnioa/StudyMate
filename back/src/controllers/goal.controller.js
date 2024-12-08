const goalService = require('../services/goal.service');
const { CustomError } = require('../utils/error.utils');
const { GOAL_STATUS, GOAL_CATEGORIES } = require('../models/goal.model');

const goalController = {
    // 목표 생성
    createGoal: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { title, category, deadline, description } = req.body;

            const goal = await goalService.createGoal({
                memberId: userId,
                title,
                category,
                deadline,
                description
            });

            return res.status(201).json({
                success: true,
                message: '목표가 성공적으로 생성되었습니다.',
                data: goal
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 목표 목록 조회
    getGoals: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { category, status, sort } = req.query;

            const goals = await goalService.getGoals(userId, {
                category,
                status,
                sort
            });

            return res.status(200).json({
                success: true,
                data: goals
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 목표 상세 조회
    getGoalDetail: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { goalId } = req.params;

            const goal = await goalService.getGoalDetail(goalId, userId);

            return res.status(200).json({
                success: true,
                data: goal
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 목표 수정
    updateGoal: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { goalId } = req.params;
            const { title, deadline, description } = req.body;

            const updated = await goalService.updateGoal(goalId, userId, {
                title,
                deadline,
                description
            });

            return res.status(200).json({
                success: true,
                message: '목표가 성공적으로 수정되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 목표 진행률 업데이트
    updateGoalProgress: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { goalId } = req.params;
            const { progress, note } = req.body;

            if (progress < 0 || progress > 100) {
                throw new CustomError('진행률은 0에서 100 사이여야 합니다.', 400);
            }

            const updated = await goalService.updateGoalProgress(goalId, userId, progress, note);

            return res.status(200).json({
                success: true,
                message: '목표 진행률이 업데이트되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 목표 상태 변경
    updateGoalStatus: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { goalId } = req.params;
            const { status } = req.body;

            if (!Object.values(GOAL_STATUS).includes(status)) {
                throw new CustomError('유효하지 않은 상태값입니다.', 400);
            }

            const updated = await goalService.updateGoalStatus(goalId, userId, status);

            return res.status(200).json({
                success: true,
                message: '목표 상태가 변경되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 목표 삭제
    deleteGoal: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { goalId } = req.params;

            await goalService.deleteGoal(goalId, userId);

            return res.status(200).json({
                success: true,
                message: '목표가 성공적으로 삭제되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 목표 카테고리 목록 조회
    getCategories: async (req, res, next) => {
        try {
            const categories = await goalService.getGoalCategories();

            return res.status(200).json({
                success: true,
                data: categories
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 목표 유효성 검사
    validateGoal: async (req, res, next) => {
        try {
            const { title, category, deadline, description } = req.body;

            if (!Object.values(GOAL_CATEGORIES).includes(category)) {
                throw new CustomError('유효하지 않은 카테고리입니다.', 400);
            }

            await goalService.validateGoal({
                title,
                category,
                deadline,
                description
            });

            return res.status(200).json({
                success: true,
                message: '유효한 목표입니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    }
};

module.exports = goalController;