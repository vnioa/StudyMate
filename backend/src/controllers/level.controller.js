const levelService = require('../services/level.service');
const { CustomError } = require('../utils/error.utils');
const { EXPERIENCE_TYPES } = require('../models/level.model');

const levelController = {
    // 레벨 정보 조회
    getLevelInfo: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const levelInfo = await levelService.getLevelInfo(userId);

            return res.status(200).json({
                success: true,
                message: '레벨 정보를 성공적으로 조회했습니다.',
                data: levelInfo
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 레벨 통계 조회
    getLevelStats: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const stats = await levelService.getLevelStats(userId);

            return res.status(200).json({
                success: true,
                message: '레벨 통계를 성공적으로 조회했습니다.',
                data: stats
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 레벨 달성 조건 조회
    getLevelRequirements: async (req, res, next) => {
        try {
            const { level } = req.query;
            const requirements = await levelService.getLevelRequirements(level);

            return res.status(200).json({
                success: true,
                message: '레벨 달성 조건을 성공적으로 조회했습니다.',
                data: requirements
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 경험치 획득
    gainExperience: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { amount, type, description } = req.body;

            if (!Object.values(EXPERIENCE_TYPES).includes(type)) {
                throw new CustomError('유효하지 않은 경험치 획득 유형입니다.', 400);
            }

            if (amount <= 0) {
                throw new CustomError('경험치는 0보다 커야 합니다.', 400);
            }

            const result = await levelService.gainExperience({
                memberId: userId,
                amount,
                type,
                description
            });

            return res.status(200).json({
                success: true,
                message: '경험치가 성공적으로 획득되었습니다.',
                data: result
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    }
};

module.exports = levelController;