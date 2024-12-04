const settingsService = require('../services/settings.service');
const { CustomError } = require('../utils/error.utils');
const { DISPLAY_MODES, THEME_TYPES, BACKUP_INTERVALS } = require('../models/settings.model');

const settingsController = {
    // 디스플레이 모드 조회
    getCurrentDisplayMode: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const mode = await settingsService.getCurrentDisplayMode(userId);

            return res.status(200).json({
                success: true,
                data: { mode }
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 디스플레이 설정 조회
    getDisplaySettings: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const settings = await settingsService.getDisplaySettings(userId);

            return res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 디스플레이 모드 업데이트
    updateDisplayMode: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { mode, autoMode, schedule } = req.body;

            if (mode && !Object.values(DISPLAY_MODES).includes(mode)) {
                throw new CustomError('유효하지 않은 디스플레이 모드입니다.', 400);
            }

            const updated = await settingsService.updateDisplayMode(userId, {
                mode,
                autoMode,
                schedule
            });

            return res.status(200).json({
                success: true,
                message: '디스플레이 모드가 업데이트되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 디스플레이 설정 업데이트
    updateDisplaySettings: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { autoMode, schedule } = req.body;

            const updated = await settingsService.updateDisplaySettings(userId, {
                autoMode,
                schedule
            });

            return res.status(200).json({
                success: true,
                message: '디스플레이 설정이 업데이트되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 폰트 설정 조회
    getFontSettings: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const settings = await settingsService.getFontSettings(userId);

            return res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 폰트 설정 업데이트
    updateFontSettings: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { fontSize, applyGlobally } = req.body;

            if (fontSize < 8 || fontSize > 32) {
                throw new CustomError('글자 크기는 8에서 32 사이여야 합니다.', 400);
            }

            const updated = await settingsService.updateFontSettings(userId, {
                fontSize,
                applyGlobally
            });

            return res.status(200).json({
                success: true,
                message: '폰트 설정이 업데이트되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 폰트 설정 초기화
    resetFontSettings: async (req, res, next) => {
        try {
            const userId = req.user.id;
            await settingsService.resetFontSettings(userId);

            return res.status(200).json({
                success: true,
                message: '폰트 설정이 초기화되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 미리보기 텍스트 업데이트
    updatePreviewText: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { previewText } = req.body;

            const updated = await settingsService.updatePreviewText(userId, previewText);

            return res.status(200).json({
                success: true,
                message: '미리보기 텍스트가 업데이트되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 일반 설정 조회
    getSettings: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const settings = await settingsService.getSettings(userId);

            return res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 설정 업데이트
    updateSettings: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { key, value } = req.body;

            const updated = await settingsService.updateSettings(userId, key, value);

            return res.status(200).json({
                success: true,
                message: '설정이 업데이트되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 알림 설정 조회
    getNotificationSettings: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const settings = await settingsService.getNotificationSettings(userId);

            return res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 알림 설정 업데이트
    updateNotificationSettings: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { pushEnabled, emailEnabled, soundEnabled } = req.body;

            const updated = await settingsService.updateNotificationSettings(userId, {
                pushEnabled,
                emailEnabled,
                soundEnabled
            });

            return res.status(200).json({
                success: true,
                message: '알림 설정이 업데이트되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 알림 권한 요청
    requestNotificationPermission: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const result = await settingsService.requestNotificationPermission(userId);

            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 테마 설정 조회
    getThemeSettings: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const settings = await settingsService.getThemeSettings(userId);

            return res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 테마 설정 업데이트
    updateThemeSettings: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { theme } = req.body;

            if (!Object.values(THEME_TYPES).includes(theme)) {
                throw new CustomError('유효하지 않은 테마입니다.', 400);
            }

            const updated = await settingsService.updateThemeSettings(userId, theme);

            return res.status(200).json({
                success: true,
                message: '테마 설정이 업데이트되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 앱 버전 조회
    getAppVersion: async (req, res, next) => {
        try {
            const version = await settingsService.getAppVersion();

            return res.status(200).json({
                success: true,
                data: { version }
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 개인정보 설정 조회
    getPrivacySettings: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const settings = await settingsService.getPrivacySettings(userId);

            return res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 개인정보 설정 업데이트
    updatePrivacySettings: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { isPublic, allowMessages, showActivity, showProgress } = req.body;

            const updated = await settingsService.updatePrivacySettings(userId, {
                isPublic,
                allowMessages,
                showActivity,
                showProgress
            });

            return res.status(200).json({
                success: true,
                message: '개인정보 설정이 업데이트되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 시스템 설정 열기
    openSystemSettings: async (req, res, next) => {
        try {
            const result = await settingsService.openSystemSettings();

            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 백업 설정 조회
    getBackupSettings: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const settings = await settingsService.getBackupSettings(userId);

            return res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 자동 백업 설정 업데이트
    updateAutoBackup: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { enabled, interval } = req.body;

            if (!Object.values(BACKUP_INTERVALS).includes(interval)) {
                throw new CustomError('유효하지 않은 백업 주기입니다.', 400);
            }

            const updated = await settingsService.updateAutoBackup(userId, {
                enabled,
                interval
            });

            return res.status(200).json({
                success: true,
                message: '자동 백업 설정이 업데이트되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 설정 백업
    backupSettings: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const backup = await settingsService.backupSettings(userId);

            return res.status(200).json({
                success: true,
                message: '설정이 백업되었습니다.',
                data: backup
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 설정 복원
    restoreSettings: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const restored = await settingsService.restoreSettings(userId);

            return res.status(200).json({
                success: true,
                message: '설정이 복원되었습니다.',
                data: restored
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 시간 설정 조회
    getTimeSettings: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { title } = req.params;
            const settings = await settingsService.getTimeSettings(userId, title);

            return res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 시간 설정 업데이트
    updateTimeSettings: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { title } = req.params;
            const { startTime, endTime, enabled, days } = req.body;

            const updated = await settingsService.updateTimeSettings(userId, title, {
                startTime,
                endTime,
                enabled,
                days
            });

            return res.status(200).json({
                success: true,
                message: '시간 설정이 업데이트되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    }
};

module.exports = settingsController;