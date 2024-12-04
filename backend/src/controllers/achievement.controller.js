const achievementService = require('../services/achievement.service');
const { CustomError } = require('../utils/error.utils');

const achievementController = {
    // 업적 목록 조회
    getAchievements: async (req, res, next) => {
        try {
            const { category, difficulty, isHidden } = req.query;
            const userId = req.user.id;

            const achievements = await achievementService.getAchievements(userId, {
                category,
                difficulty,
                isHidden: isHidden === 'true'
            });

            return res.status(200).json({
                success: true,
                message: '업적 목록을 성공적으로 조회했습니다.',
                data: achievements
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 업적 상세 조회
    getAchievementDetail: async (req, res, next) => {
        try {
            const { achievementId } = req.params;
            const userId = req.user.id;

            const achievement = await achievementService.getAchievementDetail(achievementId, userId);

            if (!achievement) {
                throw new CustomError('해당 업적을 찾을 수 없습니다.', 404);
            }

            return res.status(200).json({
                success: true,
                message: '업적 상세 정보를 성공적으로 조회했습니다.',
                data: achievement
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 업적 진행도 업데이트
    updateProgress: async (req, res, next) => {
        try {
            const { achievementId } = req.params;
            const { progress } = req.body;
            const userId = req.user.id;

            if (typeof progress !== 'number' || progress < 0) {
                throw new CustomError('유효하지 않은 진행도입니다.', 400);
            }

            const updatedAchievement = await achievementService.updateProgress(
                achievementId,
                userId,
                progress
            );

            return res.status(200).json({
                success: true,
                message: '업적 진행도가 성공적으로 업데이트되었습니다.',
                data: updatedAchievement
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 업적 획득 처리
    acquireAchievement: async (req, res, next) => {
        try {
            const { achievementId } = req.params;
            const userId = req.user.id;

            const acquiredAchievement = await achievementService.acquireAchievement(
                achievementId,
                userId
            );

            if (!acquiredAchievement) {
                throw new CustomError('업적 획득 조건이 충족되지 않았습니다.', 400);
            }

            return res.status(200).json({
                success: true,
                message: '업적을 성공적으로 획득했습니다.',
                data: acquiredAchievement
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    }
};

module.exports = achievementController;