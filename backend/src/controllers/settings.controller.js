const settingsService = require('../services/settings.service');

const settingsController = {
    // 디스플레이 관련 컨트롤러
    getCurrentDisplayMode: async (req, res) => {
        try {
            const result = await settingsService.getCurrentDisplayMode();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getDisplaySettings: async (req, res) => {
        try {
            const result = await settingsService.getDisplaySettings();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    updateDisplayMode: async (req, res) => {
        try {
            const result = await settingsService.updateDisplayMode(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    updateDisplaySettings: async (req, res) => {
        try {
            const result = await settingsService.updateDisplaySettings(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 글자 크기 관련 컨트롤러
    getFontSettings: async (req, res) => {
        try {
            const result = await settingsService.getFontSettings();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    updateFontSettings: async (req, res) => {
        try {
            const result = await settingsService.updateFontSettings(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    resetFontSettings: async (req, res) => {
        try {
            const result = await settingsService.resetFontSettings();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    updatePreviewText: async (req, res) => {
        try {
            const result = await settingsService.updatePreviewText(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 일반 설정 컨트롤러
    getSettings: async (req, res) => {
        try {
            const result = await settingsService.getSettings();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    updateSettings: async (req, res) => {
        try {
            const result = await settingsService.updateSettings(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 알림 관련 컨트롤러
    getNotificationSettings: async (req, res) => {
        try {
            const result = await settingsService.getNotificationSettings();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    updateNotificationSettings: async (req, res) => {
        try {
            const result = await settingsService.updateNotificationSettings(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    requestNotificationPermission: async (req, res) => {
        try {
            const result = await settingsService.requestNotificationPermission();
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 테마 관련 컨트롤러
    getThemeSettings: async (req, res) => {
        try {
            const result = await settingsService.getThemeSettings();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    updateThemeSettings: async (req, res) => {
        try {
            const result = await settingsService.updateThemeSettings(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 앱 버전 관련 컨트롤러
    getAppVersion: async (req, res) => {
        try {
            const result = await settingsService.getAppVersion();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 개인정보 관련 컨트롤러
    getPrivacySettings: async (req, res) => {
        try {
            const result = await settingsService.getPrivacySettings();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    updatePrivacySettings: async (req, res) => {
        try {
            const result = await settingsService.updatePrivacySettings(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 시스템 설정 관련 컨트롤러
    openSystemSettings: async (req, res) => {
        try {
            const result = await settingsService.openSystemSettings();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 백업 관련 컨트롤러
    getBackupSettings: async (req, res) => {
        try {
            const result = await settingsService.getBackupSettings();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    updateAutoBackup: async (req, res) => {
        try {
            const result = await settingsService.updateAutoBackup(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    backupSettings: async (req, res) => {
        try {
            const result = await settingsService.backupSettings();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    restoreSettings: async (req, res) => {
        try {
            const result = await settingsService.restoreSettings();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 시간 설정 관련 컨트롤러
    getTimeSettings: async (req, res) => {
        try {
            const result = await settingsService.getTimeSettings(req.params.title);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    updateTimeSettings: async (req, res) => {
        try {
            const result = await settingsService.updateTimeSettings(req.params.title, req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = settingsController;