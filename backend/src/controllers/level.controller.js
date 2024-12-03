const levelService = require('../services/level.service');
const { CustomError } = require('../utils/error.utils');
const { EXPERIENCE_TYPES, LEVEL_CONSTRAINTS } = require('../models/level.model');

const levelController = {
    // 레벨 정보 조회
    async getLevelInfo(req, res, next) {
        try {
            const userId = req.user.id;
            const levelInfo = await levelService.getLevelInfo(userId);

            res.status(200).json({
                success: true,
                message: '레벨 정보를 성공적으로 조회했습니다.',
                data: levelInfo
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 레벨 통계 조회
    async getLevelStats(req, res, next) {
        try {
            const userId = req.user.id;
            const stats = await levelService.getLevelStats(userId);

            res.status(200).json({
                success: true,
                message: '레벨 통계를 성공적으로 조회했습니다.',
                data: stats
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 레벨 달성 조건 조회
    async getLevelRequirements(req, res, next) {
        try {
            const { level } = req.query;
            const userId = req.user.id;

            if (level && (level < LEVEL_CONSTRAINTS.MIN_LEVEL || level > LEVEL_CONSTRAINTS.MAX_LEVEL)) {
                throw new CustomError('유효하지 않은 레벨입니다.', 400);
            }

            const requirements = await levelService.getLevelRequirements(level, userId);

            res.status(200).json({
                success: true,
                message: '레벨 달성 조건을 성공적으로 조회했습니다.',
                data: requirements
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 경험치 획득
    async gainExperience(req, res, next) {
        try {
            const { amount, type, description } = req.body;
            const userId = req.user.id;

            if (!Object.values(EXPERIENCE_TYPES).includes(type)) {
                throw new CustomError('유효하지 않은 경험치 획득 유형입니다.', 400);
            }

            if (amount <= 0) {
                throw new CustomError('경험치는 0보다 커야 합니다.', 400);
            }

            const result = await levelService.gainExperience({
                userId,
                amount,
                type,
                description
            });

            res.status(200).json({
                success: true,
                message: '경험치가 성공적으로 적용되었습니다.',
                data: result
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    }
};

module.exports = levelController;