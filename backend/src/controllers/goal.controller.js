const goalService = require('../services/goal.service');
const { CustomError } = require('../utils/error.utils');
const { GOAL_STATUS, GOAL_CATEGORIES } = require('../models/goal.model');

const goalController = {
    // 목표 생성
    async createGoal(req, res, next) {
        try {
            const { title, category, deadline, description } = req.body;
            const userId = req.user.id;

            const goal = await goalService.createGoal({
                title,
                category,
                deadline: new Date(deadline),
                description,
                memberId: userId
            });

            res.status(201).json({
                success: true,
                message: '목표가 성공적으로 생성되었습니다.',
                data: goal
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 목표 목록 조회
    async getGoals(req, res, next) {
        try {
            const userId = req.user.id;
            const { category, status, page = 1, limit = 10 } = req.query;

            const goals = await goalService.getGoals(userId, {
                category,
                status,
                page: parseInt(page),
                limit: parseInt(limit)
            });

            res.status(200).json({
                success: true,
                message: '목표 목록을 성공적으로 조회했습니다.',
                data: goals
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 목표 상세 조회
    async getGoalDetail(req, res, next) {
        try {
            const { goalId } = req.params;
            const userId = req.user.id;

            const goal = await goalService.getGoalDetail(goalId, userId);

            res.status(200).json({
                success: true,
                message: '목표 상세 정보를 성공적으로 조회했습니다.',
                data: goal
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 목표 수정
    async updateGoal(req, res, next) {
        try {
            const { goalId } = req.params;
            const { title, deadline, description } = req.body;
            const userId = req.user.id;

            const updatedGoal = await goalService.updateGoal(goalId, {
                title,
                deadline: new Date(deadline),
                description,
                userId
            });

            res.status(200).json({
                success: true,
                message: '목표가 성공적으로 수정되었습니다.',
                data: updatedGoal
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 목표 진행률 업데이트
    async updateGoalProgress(req, res, next) {
        try {
            const { goalId } = req.params;
            const { progress, note } = req.body;
            const userId = req.user.id;

            if (progress < 0 || progress > 100) {
                throw new CustomError('진행률은 0에서 100 사이여야 합니다.', 400);
            }

            const updatedGoal = await goalService.updateGoalProgress(goalId, {
                progress,
                note,
                userId
            });

            res.status(200).json({
                success: true,
                message: '목표 진행률이 성공적으로 업데이트되었습니다.',
                data: updatedGoal
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 목표 상태 변경
    async updateGoalStatus(req, res, next) {
        try {
            const { goalId } = req.params;
            const { status } = req.body;
            const userId = req.user.id;

            if (!Object.values(GOAL_STATUS).includes(status)) {
                throw new CustomError('유효하지 않은 상태값입니다.', 400);
            }

            const updatedGoal = await goalService.updateGoalStatus(goalId, status, userId);

            res.status(200).json({
                success: true,
                message: '목표 상태가 성공적으로 변경되었습니다.',
                data: updatedGoal
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 목표 삭제
    async deleteGoal(req, res, next) {
        try {
            const { goalId } = req.params;
            const userId = req.user.id;

            await goalService.deleteGoal(goalId, userId);

            res.status(200).json({
                success: true,
                message: '목표가 성공적으로 삭제되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 목표 카테고리 목록 조회
    async getCategories(req, res, next) {
        try {
            const categories = await goalService.getCategories();

            res.status(200).json({
                success: true,
                message: '목표 카테고리 목록을 성공적으로 조회했습니다.',
                data: categories
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 목표 유효성 검사
    async validateGoal(req, res, next) {
        try {
            const { title, category, deadline, description } = req.body;

            if (!Object.values(GOAL_CATEGORIES).includes(category)) {
                throw new CustomError('유효하지 않은 카테고리입니다.', 400);
            }

            const deadlineDate = new Date(deadline);
            if (deadlineDate <= new Date()) {
                throw new CustomError('마감 기한은 현재 시간 이후여야 합니다.', 400);
            }

            res.status(200).json({
                success: true,
                message: '유효한 목표 데이터입니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 400));
        }
    }
};

module.exports = goalController;