const profileService = require('../services/profile.service');

const profileController = {
    // 내 프로필 조회
    getMyProfile: async (req, res) => {
        try {
            const result = await profileService.getMyProfile();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 상태 메시지 업데이트
    updateStatus: async (req, res) => {
        try {
            const result = await profileService.updateStatus(req.body.message);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = profileController;