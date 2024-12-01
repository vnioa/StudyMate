const storageService = require('../services/storage.service');

const storageController = {
    // 현재 저장소 타입 조회
    getCurrentStorage: async (req, res) => {
        try {
            const result = await storageService.getCurrentStorage();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 저장소 통계 조회
    getStorageStats: async (req, res) => {
        try {
            const result = await storageService.getStorageStats();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 저장소 타입 변경
    changeStorageType: async (req, res) => {
        try {
            const result = await storageService.changeStorageType(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 데이터 동기화
    syncData: async (req, res) => {
        try {
            const result = await storageService.syncData();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = storageController;