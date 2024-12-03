const { Settings, BackupSettings, TimeSettings, DISPLAY_MODES, THEME_TYPES, BACKUP_INTERVALS } = require('../models').Settings;
const { CustomError } = require('../utils/error.utils');

const settingsController = {
    // 디스플레이 관련 컨트롤러
    async getCurrentDisplayMode(req, res, next) {
        try {
            const settings = await Settings.findOne({
                where: { memberId: req.user.id }
            });

            if (!settings) {
                throw new CustomError('설정을 찾을 수 없습니다.', 404);
            }

            res.status(200).json({
                success: true,
                data: {
                    mode: settings.displayMode,
                    autoMode: settings.autoDisplayMode
                }
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    async getDisplaySettings(req, res, next) {
        try {
            const settings = await Settings.findOne({
                where: { memberId: req.user.id }
            });

            if (!settings) {
                throw new CustomError('설정을 찾을 수 없습니다.', 404);
            }

            res.status(200).json({
                success: true,
                data: {
                    mode: settings.displayMode,
                    autoMode: settings.autoDisplayMode,
                    schedule: {
                        start: settings.displayScheduleStart,
                        end: settings.displayScheduleEnd
                    }
                }
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    async updateDisplayMode(req, res, next) {
        try {
            const { mode, autoMode, schedule } = req.body;
            const memberId = req.user.id;

            if (!Object.values(DISPLAY_MODES).includes(mode)) {
                throw new CustomError('유효하지 않은 디스플레이 모드입니다.', 400);
            }

            const [updated] = await Settings.update({
                displayMode: mode,
                autoDisplayMode: autoMode,
                displayScheduleStart: schedule?.start || null,
                displayScheduleEnd: schedule?.end || null
            }, {
                where: { memberId }
            });

            if (!updated) {
                throw new CustomError('설정 업데이트에 실패했습니다.', 404);
            }

            res.status(200).json({
                success: true,
                message: '디스플레이 모드가 업데이트되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    async updateDisplaySettings(req, res, next) {
        try {
            const { autoMode, schedule } = req.body;
            const memberId = req.user.id;

            const [updated] = await Settings.update({
                autoDisplayMode: autoMode,
                displayScheduleStart: schedule?.start || null,
                displayScheduleEnd: schedule?.end || null
            }, {
                where: { memberId }
            });

            if (!updated) {
                throw new CustomError('설정 업데이트에 실패했습니다.', 404);
            }

            res.status(200).json({
                success: true,
                message: '디스플레이 설정이 업데이트되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 폰트 관련 컨트롤러
    async getFontSettings(req, res, next) {
        try {
            const settings = await Settings.findOne({
                where: { memberId: req.user.id }
            });

            if (!settings) {
                throw new CustomError('설정을 찾을 수 없습니다.', 404);
            }

            res.status(200).json({
                success: true,
                data: {
                    fontSize: settings.fontSize,
                    previewText: settings.fontPreviewText
                }
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    async updateFontSettings(req, res, next) {
        try {
            const { fontSize, applyGlobally } = req.body;
            const memberId = req.user.id;

            if (fontSize < 8 || fontSize > 32) {
                throw new CustomError('글자 크기는 8에서 32 사이여야 합니다.', 400);
            }

            const [updated] = await Settings.update({
                fontSize
            }, {
                where: { memberId }
            });

            if (!updated) {
                throw new CustomError('설정 업데이트에 실패했습니다.', 404);
            }

            res.status(200).json({
                success: true,
                message: '폰트 설정이 업데이트되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    async resetFontSettings(req, res, next) {
        try {
            const [updated] = await Settings.update({
                fontSize: 16,
                fontPreviewText: null
            }, {
                where: { memberId: req.user.id }
            });

            if (!updated) {
                throw new CustomError('설정 초기화에 실패했습니다.', 404);
            }

            res.status(200).json({
                success: true,
                message: '폰트 설정이 초기화되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    async updatePreviewText(req, res, next) {
        try {
            const { previewText } = req.body;
            const memberId = req.user.id;

            const [updated] = await Settings.update({
                fontPreviewText: previewText
            }, {
                where: { memberId }
            });

            if (!updated) {
                throw new CustomError('미리보기 텍스트 업데이트에 실패했습니다.', 404);
            }

            res.status(200).json({
                success: true,
                message: '미리보기 텍스트가 업데이트되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 테마 관련 컨트롤러
    async getThemeSettings(req, res, next) {
        try {
            const settings = await Settings.findOne({
                where: { memberId: req.user.id }
            });

            if (!settings) {
                throw new CustomError('설정을 찾을 수 없습니다.', 404);
            }

            res.status(200).json({
                success: true,
                data: {
                    theme: settings.theme
                }
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    async updateThemeSettings(req, res, next) {
        try {
            const { theme } = req.body;
            const memberId = req.user.id;

            if (!Object.values(THEME_TYPES).includes(theme)) {
                throw new CustomError('유효하지 않은 테마입니다.', 400);
            }

            const [updated] = await Settings.update({
                theme
            }, {
                where: { memberId }
            });

            if (!updated) {
                throw new CustomError('테마 설정 업데이트에 실패했습니다.', 404);
            }

            res.status(200).json({
                success: true,
                message: '테마 설정이 업데이트되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 백업 관련 컨트롤러
    async getBackupSettings(req, res, next) {
        try {
            const backupSettings = await BackupSettings.findOne({
                where: { memberId: req.user.id }
            });

            if (!backupSettings) {
                throw new CustomError('백업 설정을 찾을 수 없습니다.', 404);
            }

            res.status(200).json({
                success: true,
                data: backupSettings
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    async updateAutoBackup(req, res, next) {
        try {
            const { enabled, interval } = req.body;
            const memberId = req.user.id;

            if (!Object.values(BACKUP_INTERVALS).includes(interval)) {
                throw new CustomError('유효하지 않은 백업 주기입니다.', 400);
            }

            const [updated] = await BackupSettings.update({
                autoBackup: enabled,
                backupInterval: interval
            }, {
                where: { memberId }
            });

            if (!updated) {
                throw new CustomError('백업 설정 업데이트에 실패했습니다.', 404);
            }

            res.status(200).json({
                success: true,
                message: '자동 백업 설정이 업데이트되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 시간 설정 관련 컨트롤러
    async getTimeSettings(req, res, next) {
        try {
            const { title } = req.params;
            const timeSettings = await TimeSettings.findOne({
                where: {
                    memberId: req.user.id,
                    title
                }
            });

            if (!timeSettings) {
                throw new CustomError('시간 설정을 찾을 수 없습니다.', 404);
            }

            res.status(200).json({
                success: true,
                data: timeSettings
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    async updateTimeSettings(req, res, next) {
        try {
            const { title } = req.params;
            const { startTime, endTime, enabled, days } = req.body;
            const memberId = req.user.id;

            if (!Array.isArray(days) || !days.every(day => [0,1,2,3,4,5,6].includes(day))) {
                throw new CustomError('유효하지 않은 요일 설정입니다.', 400);
            }

            const [updated] = await TimeSettings.update({
                startTime,
                endTime,
                enabled,
                days
            }, {
                where: {
                    memberId,
                    title
                }
            });

            if (!updated) {
                throw new CustomError('시간 설정 업데이트에 실패했습니다.', 404);
            }

            res.status(200).json({
                success: true,
                message: '시간 설정이 업데이트되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    }
};

module.exports = settingsController;