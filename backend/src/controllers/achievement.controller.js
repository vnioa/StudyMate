const achievementService = require('../services/achievement.service');
const { CustomError } = require('../utils/error.utils');

const achievementController = {
    // 업적 목록 조회
    async getAchievements(req, res, next) {
        try {
            const result = await achievementService.getAchievements(req.user.id);
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(new CustomError(error.message, 500));
        }
    },

    // 업적 상세 조회
    async getAchievementDetail(req, res, next) {
        try {
            const { achievementId } = req.params;
            const result = await achievementService.getAchievementDetail(
                achievementId,
                req.user.id
            );

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 업적 진행도 업데이트
    async updateProgress(req, res, next) {
        try {
            const { achievementId } = req.params;
            const { progress } = req.body;

            if (typeof progress !== 'number' || progress < 0) {
                throw new CustomError('유효하지 않은 진행도입니다.', 400);
            }

            const result = await achievementService.updateProgress(
                achievementId,
                progress,
                req.user.id
            );

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 업적 획득 처리
    async acquireAchievement(req, res, next) {
        try {
            const { achievementId } = req.params;

            const result = await achievementService.acquireAchievement(
                achievementId,
                req.user.id
            );

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    }
};

module.exports = achievementController;