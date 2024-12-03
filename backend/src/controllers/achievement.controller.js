const { Achievement, UserAchievement, AchievementHistory, ACHIEVEMENT_CATEGORIES, DIFFICULTY_LEVELS, HISTORY_ACTIONS } = require('../models').Achievement;
const { CustomError } = require('../utils/error.utils');

const achievementController = {
    // 업적 목록 조회
    async getAchievements(req, res, next) {
        try {
            const achievements = await Achievement.findAll({
                include: [{
                    model: UserAchievement,
                    where: { memberId: req.user.id },
                    required: false
                }]
            });

            res.status(200).json({
                success: true,
                data: achievements
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 업적 상세 조회
    async getAchievementDetail(req, res, next) {
        try {
            const { achievementId } = req.params;

            const achievement = await Achievement.findOne({
                where: { id: achievementId },
                include: [{
                    model: UserAchievement,
                    where: { memberId: req.user.id },
                    required: false,
                    include: [{
                        model: AchievementHistory,
                        as: 'history'
                    }]
                }]
            });

            if (!achievement) {
                throw new CustomError('업적을 찾을 수 없습니다.', 404);
            }

            if (achievement.isHidden && !achievement.UserAchievement) {
                throw new CustomError('접근할 수 없는 업적입니다.', 403);
            }

            res.status(200).json({
                success: true,
                data: achievement
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
            const memberId = req.user.id;

            if (typeof progress !== 'number' || progress < 0) {
                throw new CustomError('유효하지 않은 진행도입니다.', 400);
            }

            const achievement = await Achievement.findByPk(achievementId);
            if (!achievement) {
                throw new CustomError('업적을 찾을 수 없습니다.', 404);
            }

            let [userAchievement] = await UserAchievement.findOrCreate({
                where: {
                    memberId,
                    achievementId
                },
                defaults: {
                    progress: 0,
                    isAcquired: false
                }
            });

            const progressChange = progress - userAchievement.progress;

            await UserAchievement.update({
                progress: progress
            }, {
                where: {
                    memberId,
                    achievementId
                }
            });

            await AchievementHistory.create({
                userAchievementId: userAchievement.id,
                progressChange,
                action: HISTORY_ACTIONS.PROGRESS,
                details: { newProgress: progress }
            });

            res.status(200).json({
                success: true,
                message: '진행도가 업데이트되었습니다.',
                data: { progress }
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 400));
        }
    },

    // 업적 획득 처리
    async acquireAchievement(req, res, next) {
        try {
            const { achievementId } = req.params;
            const memberId = req.user.id;

            const achievement = await Achievement.findByPk(achievementId);
            if (!achievement) {
                throw new CustomError('업적을 찾을 수 없습니다.', 404);
            }

            const userAchievement = await UserAchievement.findOne({
                where: {
                    memberId,
                    achievementId
                }
            });

            if (!userAchievement) {
                throw new CustomError('업적 진행 정보를 찾을 수 없습니다.', 404);
            }

            if (userAchievement.isAcquired) {
                throw new CustomError('이미 획득한 업적입니다.', 400);
            }

            if (userAchievement.progress < achievement.requiredProgress) {
                throw new CustomError('업적 획득 조건을 충족하지 않았습니다.', 400);
            }

            await UserAchievement.update({
                isAcquired: true,
                acquiredAt: new Date()
            }, {
                where: {
                    memberId,
                    achievementId
                }
            });

            await AchievementHistory.create({
                userAchievementId: userAchievement.id,
                progressChange: achievement.requiredProgress,
                action: HISTORY_ACTIONS.ACQUIRE,
                details: { reward: achievement.reward }
            });

            res.status(200).json({
                success: true,
                message: '업적을 획득했습니다.',
                data: {
                    achievement,
                    reward: achievement.reward
                }
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 400));
        }
    }
};

module.exports = achievementController;