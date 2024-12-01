const backupService = require('../services/backup.service');

const backupController = {
    // 마지막 백업 정보 조회
    getLastBackup: async (req, res) => {
        try {
            const result = await backupService.getLastBackup();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 백업 상태 조회
    getBackupStatus: async (req, res) => {
        try {
            const result = await backupService.getBackupStatus();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 새로운 백업 생성
    createBackup: async (req, res) => {
        try {
            const result = await backupService.createBackup();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 백업 복원
    restoreFromBackup: async (req, res) => {
        try {
            const result = await backupService.restoreFromBackup();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 백업 설정 조회
    getSettings: async (req, res) => {
        try {
            const result = await backupService.getSettings();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 백업 설정 업데이트
    updateSettings: async (req, res) => {
        try {
            const result = await backupService.updateSettings(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = backupController;