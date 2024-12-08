const { dbUtils } = require('../config/database.config');

const settingsService = {
    // 디스플레이 모드 조회
    async getCurrentDisplayMode(userId) {
        try {
            const query = `
                SELECT displayMode, autoDisplayMode, 
                       displayScheduleStart, displayScheduleEnd
                FROM settings
                WHERE memberId = ?
            `;
            const [settings] = await dbUtils.query(query, [userId]);
            return settings?.displayMode || 'light';
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
                WHERE memberId = ?
            `;
            const [settings] = await dbUtils.query(query, [userId]);
            return settings;
        } catch (error) {
            throw new Error('디스플레이 설정 조회 실패: ' + error.message);
        }
    },

    // 디스플레이 모드 업데이트
    async updateDisplayMode(userId, updateData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const query = `
                    INSERT INTO settings (
                        memberId, displayMode, autoDisplayMode, 
                        displayScheduleStart, displayScheduleEnd,
                        updatedAt
                    ) VALUES (?, ?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE
                        displayMode = VALUES(displayMode),
                        autoDisplayMode = VALUES(autoDisplayMode),
                        displayScheduleStart = VALUES(displayScheduleStart),
                        displayScheduleEnd = VALUES(displayScheduleEnd),
                        updatedAt = NOW()
                `;

                await connection.query(query, [
                    userId,
                    updateData.mode,
                    updateData.autoMode,
                    updateData.schedule?.start,
                    updateData.schedule?.end
                ]);

                return { success: true, ...updateData };
            } catch (error) {
                throw new Error('디스플레이 모드 업데이트 실패: ' + error.message);
            }
        });
    },

    // 폰트 설정 조회
    async getFontSettings(userId) {
        try {
            const query = `
                SELECT fontSize, fontPreviewText
                FROM settings
                WHERE memberId = ?
            `;
            const [settings] = await dbUtils.query(query, [userId]);
            return settings;
        } catch (error) {
            throw new Error('폰트 설정 조회 실패: ' + error.message);
        }
    },

    // 폰트 설정 업데이트
    async updateFontSettings(userId, fontData) {
        try {
            const query = `
                UPDATE settings
                SET fontSize = ?,
                    updatedAt = NOW()
                WHERE memberId = ?
            `;
            await dbUtils.query(query, [fontData.fontSize, userId]);
            return { success: true, ...fontData };
        } catch (error) {
            throw new Error('폰트 설정 업데이트 실패: ' + error.message);
        }
    },

    // 폰트 설정 초기화
    async resetFontSettings(userId) {
        try {
            const query = `
                UPDATE settings
                SET fontSize = 16,
                    fontPreviewText = NULL,
                    updatedAt = NOW()
                WHERE memberId = ?
            `;
            await dbUtils.query(query, [userId]);
            return { success: true };
        } catch (error) {
            throw new Error('폰트 설정 초기화 실패: ' + error.message);
        }
    },

    // 미리보기 텍스트 업데이트
    async updatePreviewText(userId, previewText) {
        try {
            const query = `
                UPDATE settings
                SET fontPreviewText = ?,
                    updatedAt = NOW()
                WHERE memberId = ?
            `;
            await dbUtils.query(query, [previewText, userId]);
            return { success: true, previewText };
        } catch (error) {
            throw new Error('미리보기 텍스트 업데이트 실패: ' + error.message);
        }
    },

    // 테마 설정 조회
    async getThemeSettings(userId) {
        try {
            const query = `
                SELECT theme, displayMode
                FROM settings
                WHERE memberId = ?
            `;
            const [settings] = await dbUtils.query(query, [userId]);
            return settings;
        } catch (error) {
            throw new Error('테마 설정 조회 실패: ' + error.message);
        }
    },

    // 테마 설정 업데이트
    async updateThemeSettings(userId, theme) {
        try {
            const query = `
                UPDATE settings
                SET theme = ?,
                    updatedAt = NOW()
                WHERE memberId = ?
            `;
            await dbUtils.query(query, [theme, userId]);
            return { success: true, theme };
        } catch (error) {
            throw new Error('테마 설정 업데이트 실패: ' + error.message);
        }
    },

    // 백업 설정 조회
    async getBackupSettings(userId) {
        try {
            const query = `
                SELECT autoBackup, backupInterval, lastBackupDate,
                       backupLocation, backupSize, maxBackupSize,
                       retentionPeriod
                FROM backup_settings
                WHERE memberId = ?
            `;
            const [settings] = await dbUtils.query(query, [userId]);
            return settings;
        } catch (error) {
            throw new Error('백업 설정 조회 실패: ' + error.message);
        }
    },

    // 자동 백업 설정 업데이트
    async updateAutoBackup(userId, backupData) {
        try {
            const query = `
                INSERT INTO backup_settings (
                    memberId, autoBackup, backupInterval, updatedAt
                ) VALUES (?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                    autoBackup = VALUES(autoBackup),
                    backupInterval = VALUES(backupInterval),
                    updatedAt = NOW()
            `;
            await dbUtils.query(query, [
                userId,
                backupData.enabled,
                backupData.interval
            ]);
            return { success: true, ...backupData };
        } catch (error) {
            throw new Error('자동 백업 설정 업데이트 실패: ' + error.message);
        }
    },

    // 시간 설정 조회
    async getTimeSettings(userId, title) {
        try {
            const query = `
                SELECT title, startTime, endTime, enabled, days
                FROM time_settings
                WHERE memberId = ? AND title = ?
            `;
            const [settings] = await dbUtils.query(query, [userId, title]);
            return settings;
        } catch (error) {
            throw new Error('시간 설정 조회 실패: ' + error.message);
        }
    },

    // 시간 설정 업데이트
    async updateTimeSettings(userId, title, timeData) {
        try {
            const query = `
                INSERT INTO time_settings (
                    memberId, title, startTime, endTime, 
                    enabled, days, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                    startTime = VALUES(startTime),
                    endTime = VALUES(endTime),
                    enabled = VALUES(enabled),
                    days = VALUES(days),
                    updatedAt = NOW()
            `;
            await dbUtils.query(query, [
                userId,
                title,
                timeData.startTime,
                timeData.endTime,
                timeData.enabled,
                JSON.stringify(timeData.days)
            ]);
            return { success: true, ...timeData };
        } catch (error) {
            throw new Error('시간 설정 업데이트 실패: ' + error.message);
        }
    },

    // 디스플레이 설정 업데이트
    async updateDisplaySettings(userId, settingsData) {
        try {
            const query = `
            UPDATE settings
            SET autoDisplayMode = ?,
                displayScheduleStart = ?,
                displayScheduleEnd = ?,
                updatedAt = NOW()
            WHERE memberId = ?
        `;

            await dbUtils.query(query, [
                settingsData.autoMode,
                settingsData.schedule?.start,
                settingsData.schedule?.end,
                userId
            ]);

            return { success: true, ...settingsData };
        } catch (error) {
            throw new Error('디스플레이 설정 업데이트 실패: ' + error.message);
        }
    },

// 일반 설정 조회
    async getSettings(userId) {
        try {
            const query = `
            SELECT *
            FROM settings
            WHERE memberId = ?
        `;

            const [settings] = await dbUtils.query(query, [userId]);
            return settings;
        } catch (error) {
            throw new Error('설정 조회 실패: ' + error.message);
        }
    },

// 설정 업데이트
    async updateSettings(userId, key, value) {
        try {
            const query = `
            UPDATE settings
            SET ?? = ?,
                updatedAt = NOW()
            WHERE memberId = ?
        `;

            await dbUtils.query(query, [key, value, userId]);
            return { success: true, [key]: value };
        } catch (error) {
            throw new Error('설정 업데이트 실패: ' + error.message);
        }
    },

// 알림 설정 조회
    async getNotificationSettings(userId) {
        try {
            const query = `
            SELECT pushEnabled, emailEnabled, soundEnabled
            FROM notification_settings
            WHERE memberId = ?
        `;

            const [settings] = await dbUtils.query(query, [userId]);
            return settings;
        } catch (error) {
            throw new Error('알림 설정 조회 실패: ' + error.message);
        }
    },

// 알림 설정 업데이트
    async updateNotificationSettings(userId, settingsData) {
        try {
            const query = `
            INSERT INTO notification_settings (
                memberId, pushEnabled, emailEnabled, soundEnabled, updatedAt
            ) VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                pushEnabled = VALUES(pushEnabled),
                emailEnabled = VALUES(emailEnabled),
                soundEnabled = VALUES(soundEnabled),
                updatedAt = NOW()
        `;

            await dbUtils.query(query, [
                userId,
                settingsData.pushEnabled,
                settingsData.emailEnabled,
                settingsData.soundEnabled
            ]);

            return { success: true, ...settingsData };
        } catch (error) {
            throw new Error('알림 설정 업데이트 실패: ' + error.message);
        }
    },

// 알림 권한 요청
    async requestNotificationPermission(userId) {
        try {
            const [settings] = await dbUtils.query(
                'SELECT pushEnabled FROM notification_settings WHERE memberId = ?',
                [userId]
            );

            if (!settings?.pushEnabled) {
                throw new Error('알림 권한이 비활성화되어 있습니다.');
            }

            return { granted: true };
        } catch (error) {
            throw new Error('알림 권한 요청 실패: ' + error.message);
        }
    },

// 개인정보 설정 조회
    async getPrivacySettings(userId) {
        try {
            const query = `
            SELECT isPublic, allowMessages, showActivity, showProgress
            FROM privacy_settings
            WHERE memberId = ?
        `;

            const [settings] = await dbUtils.query(query, [userId]);
            return settings;
        } catch (error) {
            throw new Error('개인정보 설정 조회 실패: ' + error.message);
        }
    },

// 개인정보 설정 업데이트
    async updatePrivacySettings(userId, settingsData) {
        try {
            const query = `
            INSERT INTO privacy_settings (
                memberId, isPublic, allowMessages, 
                showActivity, showProgress, updatedAt
            ) VALUES (?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                isPublic = VALUES(isPublic),
                allowMessages = VALUES(allowMessages),
                showActivity = VALUES(showActivity),
                showProgress = VALUES(showProgress),
                updatedAt = NOW()
        `;

            await dbUtils.query(query, [
                userId,
                settingsData.isPublic,
                settingsData.allowMessages,
                settingsData.showActivity,
                settingsData.showProgress
            ]);

            return { success: true, ...settingsData };
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
        return await dbUtils.transaction(async (connection) => {
            try {
                const [settings] = await connection.query(
                    'SELECT * FROM settings WHERE memberId = ?',
                    [userId]
                );

                const backupData = JSON.stringify(settings);
                const timestamp = new Date().toISOString();

                await connection.query(`
                INSERT INTO settings_backups (
                    memberId, data, createdAt
                ) VALUES (?, ?, NOW())
            `, [userId, backupData]);

                return { success: true, timestamp };
            } catch (error) {
                throw new Error('설정 백업 실패: ' + error.message);
            }
        });
    },

// 설정 복원
    async restoreSettings(userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [backup] = await connection.query(`
                SELECT data 
                FROM settings_backups 
                WHERE memberId = ? 
                ORDER BY createdAt DESC 
                LIMIT 1
            `, [userId]);

                if (!backup) {
                    throw new Error('복원할 백업을 찾을 수 없습니다.');
                }

                const settings = JSON.parse(backup.data);
                await connection.query(
                    'UPDATE settings SET ? WHERE memberId = ?',
                    [settings, userId]
                );

                return { success: true };
            } catch (error) {
                throw new Error('설정 복원 실패: ' + error.message);
            }
        });
    },

    // 앱 버전 조회
    async getAppVersion() {
        try {
            const query = `
            SELECT version, releaseDate, minVersion
            FROM app_versions
            ORDER BY releaseDate DESC
            LIMIT 1
        `;

            const [version] = await dbUtils.query(query);
            if (!version) {
                throw new Error('앱 버전 정보를 찾을 수 없습니다.');
            }

            return version;
        } catch (error) {
            throw new Error('앱 버전 조회 실패: ' + error.message);
        }
    }
};

module.exports = settingsService;