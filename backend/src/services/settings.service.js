const { Settings, NotificationSettings, BackupSettings, TimeSettings } = require('../models');
const { dbUtils } = require('../config/db');

const settingsService = {
    // 현재 디스플레이 모드 조회
    async getCurrentDisplayMode(userId) {
        try {
            const query = `
                SELECT displayMode, autoDisplayMode, 
                       displayScheduleStart, displayScheduleEnd
                FROM settings
                WHERE userId = ?
            `;
            const [settings] = await dbUtils.query(query, [userId]);

            if (!settings) {
                throw new Error('설정을 찾을 수 없습니다');
            }

            return { settings };
        } catch (error) {
            throw new Error('디스플레이 모드 조회 실패: ' + error.message);
        }
    },

    // 디스플레이 설정 조회
    async getDisplaySettings(userId) {
        try {
            const query = `
                SELECT displayMode, autoDisplayMode, 
                       displayScheduleStart, displayScheduleEnd,
                       fontSize, theme
                FROM settings
                WHERE userId = ?
            `;
            const [settings] = await dbUtils.query(query, [userId]);
            return { settings };
        } catch (error) {
            throw new Error('디스플레이 설정 조회 실패: ' + error.message);
        }
    },

    // 디스플레이 모드 업데이트
    async updateDisplayMode(userId, data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                await connection.query(`
                    UPDATE settings
                    SET displayMode = ?,
                        autoDisplayMode = ?,
                        displayScheduleStart = ?,
                        displayScheduleEnd = ?
                    WHERE userId = ?
                `, [
                    data.mode,
                    data.autoMode,
                    data.schedule?.start || null,
                    data.schedule?.end || null,
                    userId
                ]);

                return { success: true };
            } catch (error) {
                throw new Error('디스플레이 모드 업데이트 실패: ' + error.message);
            }
        });
    },

    // 글꼴 설정 조회
    async getFontSettings(userId) {
        try {
            const query = `
                SELECT fontSize, fontPreviewText
                FROM settings
                WHERE userId = ?
            `;
            const [settings] = await dbUtils.query(query, [userId]);
            return { settings };
        } catch (error) {
            throw new Error('글꼴 설정 조회 실패: ' + error.message);
        }
    },

    // 글꼴 설정 업데이트
    async updateFontSettings(userId, data) {
        try {
            await dbUtils.query(`
                UPDATE settings
                SET fontSize = ?
                WHERE userId = ?
            `, [data.fontSize, userId]);

            return { success: true };
        } catch (error) {
            throw new Error('글꼴 설정 업데이트 실패: ' + error.message);
        }
    },

    // 알림 설정 조회
    async getNotificationSettings(userId) {
        try {
            const query = `
                SELECT pushEnabled, emailEnabled, soundEnabled, 
                       notificationPermission
                FROM notification_settings
                WHERE userId = ?
            `;
            const [settings] = await dbUtils.query(query, [userId]);
            return { settings };
        } catch (error) {
            throw new Error('알림 설정 조회 실패: ' + error.message);
        }
    },

    // 알림 설정 업데이트
    async updateNotificationSettings(userId, data) {
        try {
            await dbUtils.query(`
                UPDATE notification_settings
                SET pushEnabled = ?,
                    emailEnabled = ?,
                    soundEnabled = ?
                WHERE userId = ?
            `, [
                data.pushEnabled,
                data.emailEnabled,
                data.soundEnabled,
                userId
            ]);

            return { success: true };
        } catch (error) {
            throw new Error('알림 설정 업데이트 실패: ' + error.message);
        }
    },

    // 백업 설정 조회
    async getBackupSettings(userId) {
        try {
            const query = `
                SELECT autoBackup, backupInterval, lastBackupDate,
                       backupLocation, backupSize
                FROM backup_settings
                WHERE userId = ?
            `;
            const [settings] = await dbUtils.query(query, [userId]);
            return { settings };
        } catch (error) {
            throw new Error('백업 설정 조회 실패: ' + error.message);
        }
    },

    // 자동 백업 설정 업데이트
    async updateAutoBackup(userId, data) {
        try {
            await dbUtils.query(`
                UPDATE backup_settings
                SET autoBackup = ?,
                    backupInterval = ?
                WHERE userId = ?
            `, [data.enabled, data.interval, userId]);

            return { success: true };
        } catch (error) {
            throw new Error('자동 백업 설정 업데이트 실패: ' + error.message);
        }
    },

    // 시간 설정 조회
    async getTimeSettings(userId, title) {
        try {
            const query = `
                SELECT startTime, endTime, enabled, days
                FROM time_settings
                WHERE userId = ? AND title = ?
            `;
            const [settings] = await dbUtils.query(query, [userId, title]);
            return { settings };
        } catch (error) {
            throw new Error('시간 설정 조회 실패: ' + error.message);
        }
    },

    // 시간 설정 업데이트
    async updateTimeSettings(userId, title, data) {
        try {
            await dbUtils.query(`
                UPDATE time_settings
                SET startTime = ?,
                    endTime = ?,
                    enabled = ?,
                    days = ?
                WHERE userId = ? AND title = ?
            `, [
                data.startTime,
                data.endTime,
                data.enabled,
                JSON.stringify(data.days),
                userId,
                title
            ]);

            return { success: true };
        } catch (error) {
            throw new Error('시간 설정 업데이트 실패: ' + error.message);
        }
    },

    // 글꼴 설정 초기화
    async resetFontSettings(userId) {
        try {
            await dbUtils.query(`
                UPDATE settings
                SET fontSize = 16,
                    fontPreviewText = NULL
                WHERE userId = ?
            `, [userId]);

            return { success: true };
        } catch (error) {
            throw new Error('글꼴 설정 초기화 실패: ' + error.message);
        }
    },

    // 미리보기 텍스트 업데이트
    async updatePreviewText(userId, data) {
        try {
            await dbUtils.query(`
                UPDATE settings
                SET fontPreviewText = ?
                WHERE userId = ?
            `, [data.previewText, userId]);

            return { success: true };
        } catch (error) {
            throw new Error('미리보기 텍스트 업데이트 실패: ' + error.message);
        }
    },

    // 앱 버전 조회
    async getAppVersion() {
        try {
            // 앱 버전 정보 조회 로직 구현
            return { version: process.env.APP_VERSION };
        } catch (error) {
            throw new Error('앱 버전 조회 실패: ' + error.message);
        }
    },

    // 개인정보 설정 조회
    async getPrivacySettings(userId) {
        try {
            const query = `
                SELECT isPublic, allowMessages, showActivity, showProgress
                FROM settings
                WHERE userId = ?
            `;
            const [settings] = await dbUtils.query(query, [userId]);
            return { settings };
        } catch (error) {
            throw new Error('개인정보 설정 조회 실패: ' + error.message);
        }
    },

    // 개인정보 설정 업데이트
    async updatePrivacySettings(userId, data) {
        try {
            const query = `
                UPDATE settings
                SET isPublic = ?,
                    allowMessages = ?,
                    showActivity = ?,
                    showProgress = ?
                WHERE userId = ?
            `;
            await dbUtils.query(query, [
                data.isPublic,
                data.allowMessages,
                data.showActivity,
                data.showProgress,
                userId
            ]);

            return { success: true };
        } catch (error) {
            throw new Error('개인정보 설정 업데이트 실패: ' + error.message);
        }
    },

    // 시스템 설정 열기
    async openSystemSettings() {
        try {
            // 시스템 설정 열기 로직 구현
            return { success: true };
        } catch (error) {
            throw new Error('시스템 설정 열기 실패: ' + error.message);
        }
    },

    // 설정 백업
    async backupSettings(userId) {
        try {
            const settings = await dbUtils.query(`
                SELECT * FROM settings WHERE userId = ?
            `, [userId]);

            // 백업 로직 구현

            return { success: true, backup: settings };
        } catch (error) {
            throw new Error('설정 백업 실패: ' + error.message);
        }
    },

    // 설정 복원
    async restoreSettings(userId, backupData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 복원 로직 구현
                return { success: true };
            } catch (error) {
                throw new Error('설정 복원 실패: ' + error.message);
            }
        });
    },
};

module.exports = settingsService;