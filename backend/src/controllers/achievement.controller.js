const achievementService = require('../services/achievement.service');

const achievementController = {
    // 업적 목록 조회
    getAchievements: async (req, res) => {
        try {
            const result = await achievementService.getAchievements();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 업적 상세 조회
    getAchievementDetail: async (req, res) => {
        try {
            const result = await achievementService.getAchievementDetail(req.params.achievementId);
            res.json(result);
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    },

    // 업적 진행도 업데이트
    updateProgress: async (req, res) => {
        try {
            const result = await achievementService.updateProgress(
                req.params.achievementId,
                req.body.progress
            );
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 업적 획득 처리
    acquireAchievement: async (req, res) => {
        try {
            const result = await achievementService.acquireAchievement(req.params.achievementId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = achievementController;