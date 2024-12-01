const levelService = require('../services/level.service');

const levelController = {
    // 레벨 정보 조회
    getLevelInfo: async (req, res) => {
        try {
            const result = await levelService.getLevelInfo();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 레벨 통계 조회
    getLevelStats: async (req, res) => {
        try {
            const result = await levelService.getLevelStats();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 레벨 달성 조건 조회
    getLevelRequirements: async (req, res) => {
        try {
            const result = await levelService.getLevelRequirements();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 경험치 획득
    gainExperience: async (req, res) => {
        try {
            const result = await levelService.gainExperience(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = levelController;