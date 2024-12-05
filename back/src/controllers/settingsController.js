const db = require('../config/db');

// 유틸리티 함수
const utils = {
    async executeQuery(query, params) {
        try {
            const [results] = await db.execute(query, params);
            return results;
        } catch (error) {
            console.error('Query execution error:', error);
            throw new Error('데이터베이스 쿼리 실행 실패');
        }
    },

    async executeTransaction(callback) {
        let connection;
        try {
            connection = await db.getConnection();
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    },

    validateFontSize(fontSize) {
        return fontSize >= 8 && fontSize <= 32;
    },

    validateTheme(theme) {
        const validThemes = ['light', 'dark', 'system'];
        return validThemes.includes(theme);
    },

    validateBackupInterval(interval) {
        const validIntervals = [1, 3, 7, 14, 30];
        return validIntervals.includes(interval);
    }
};

const settingsController = {
    // 디스플레이 모드 조회
    getCurrentDisplayMode: async (req, res) => {
        try {
            const userId = req.user.id;
            const [settings] = await utils.executeQuery(`
        SELECT displayMode, autoDisplayMode, displayScheduleStart, displayScheduleEnd 
        FROM settings WHERE memberId = ?
      `, [userId]);

            res.status(200).json({
                success: true,
                data: { mode: settings?.displayMode || 'light' }
            });
        } catch (error) {
            console.error('디스플레이 모드 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '디스플레이 모드 조회에 실패했습니다.'
            });
        }
    },

    // 디스플레이 설정 조회
    getDisplaySettings: async (req, res) => {
        try {
            const userId = req.user.id;
            const [settings] = await utils.executeQuery(`
        SELECT displayMode, autoDisplayMode, displayScheduleStart, 
               displayScheduleEnd, fontSize, theme
        FROM settings WHERE memberId = ?
      `, [userId]);

            res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            console.error('디스플레이 설정 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '디스플레이 설정 조회에 실패했습니다.'
            });
        }
    },

    // 디스플레이 모드 업데이트
    updateDisplayMode: async (req, res) => {
        try {
            const userId = req.user.id;
            const { mode, autoMode, schedule } = req.body;

            const result = await utils.executeTransaction(async (connection) => {
                await connection.execute(`
          INSERT INTO settings (
            memberId, displayMode, autoDisplayMode, 
            displayScheduleStart, displayScheduleEnd, updatedAt
          ) VALUES (?, ?, ?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
            displayMode = VALUES(displayMode),
            autoDisplayMode = VALUES(autoDisplayMode),
            displayScheduleStart = VALUES(displayScheduleStart),
            displayScheduleEnd = VALUES(displayScheduleEnd),
            updatedAt = NOW()
        `, [
                    userId,
                    mode,
                    autoMode,
                    schedule?.start,
                    schedule?.end
                ]);

                return { mode, autoMode, schedule };
            });

            res.status(200).json({
                success: true,
                message: '디스플레이 모드가 업데이트되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('디스플레이 모드 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '디스플레이 모드 업데이트에 실패했습니다.'
            });
        }
    },

    // 폰트 설정 조회
    getFontSettings: async (req, res) => {
        try {
            const userId = req.user.id;

            const [settings] = await utils.executeQuery(`
        SELECT fontSize, fontPreviewText 
        FROM settings 
        WHERE memberId = ?
      `, [userId]);

            res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            console.error('폰트 설정 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '폰트 설정 조회에 실패했습니다.'
            });
        }
    },

    // 폰트 설정 업데이트
    updateFontSettings: async (req, res) => {
        try {
            const userId = req.user.id;
            const { fontSize, applyGlobally } = req.body;

            if (fontSize < 8 || fontSize > 32) {
                return res.status(400).json({
                    success: false,
                    message: '글자 크기는 8에서 32 사이여야 합니다.'
                });
            }

            await utils.executeQuery(`
        UPDATE settings 
        SET fontSize = ?, 
            updatedAt = NOW() 
        WHERE memberId = ?
      `, [fontSize, userId]);

            res.status(200).json({
                success: true,
                message: '폰트 설정이 업데이트되었습니다.',
                data: { fontSize, applyGlobally }
            });
        } catch (error) {
            console.error('폰트 설정 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '폰트 설정 업데이트에 실패했습니다.'
            });
        }
    },

    // 폰트 설정 초기화
    resetFontSettings: async (req, res) => {
        try {
            const userId = req.user.id;

            await utils.executeQuery(`
        UPDATE settings 
        SET fontSize = 16, 
            fontPreviewText = NULL, 
            updatedAt = NOW() 
        WHERE memberId = ?
      `, [userId]);

            res.status(200).json({
                success: true,
                message: '폰트 설정이 초기화되었습니다.'
            });
        } catch (error) {
            console.error('폰트 설정 초기화 오류:', error);
            res.status(500).json({
                success: false,
                message: '폰트 설정 초기화에 실패했습니다.'
            });
        }
    },

    // 미리보기 텍스트 업데이트
    updatePreviewText: async (req, res) => {
        try {
            const userId = req.user.id;
            const { previewText } = req.body;

            await utils.executeQuery(`
        UPDATE settings 
        SET fontPreviewText = ?, 
            updatedAt = NOW() 
        WHERE memberId = ?
      `, [previewText, userId]);

            res.status(200).json({
                success: true,
                message: '미리보기 텍스트가 업데이트되었습니다.',
                data: { previewText }
            });
        } catch (error) {
            console.error('미리보기 텍스트 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '미리보기 텍스트 업데이트에 실패했습니다.'
            });
        }
    },

    // 일반 설정 조회
    getSettings: async (req, res) => {
        try {
            const userId = req.user.id;

            const [settings] = await utils.executeQuery(`
        SELECT * FROM settings 
        WHERE memberId = ?
      `, [userId]);

            res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            console.error('설정 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '설정 조회에 실패했습니다.'
            });
        }
    },

    // 설정 업데이트
    updateSettings: async (req, res) => {
        try {
            const userId = req.user.id;
            const { key, value } = req.body;

            await utils.executeQuery(`
        UPDATE settings 
        SET ?? = ?, 
            updatedAt = NOW() 
        WHERE memberId = ?
      `, [key, value, userId]);

            res.status(200).json({
                success: true,
                message: '설정이 업데이트되었습니다.',
                data: { [key]: value }
            });
        } catch (error) {
            console.error('설정 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '설정 업데이트에 실패했습니다.'
            });
        }
    },

    // 알림 설정 조회
    getNotificationSettings: async (req, res) => {
        try {
            const userId = req.user.id;

            const [settings] = await utils.executeQuery(`
        SELECT pushEnabled, emailEnabled, soundEnabled 
        FROM notification_settings 
        WHERE memberId = ?
      `, [userId]);

            res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            console.error('알림 설정 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '알림 설정 조회에 실패했습니다.'
            });
        }
    },

    // 알림 설정 업데이트
    updateNotificationSettings: async (req, res) => {
        try {
            const userId = req.user.id;
            const { pushEnabled, emailEnabled, soundEnabled } = req.body;

            await utils.executeQuery(`
        INSERT INTO notification_settings (
          memberId, pushEnabled, emailEnabled, soundEnabled, updatedAt
        ) VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          pushEnabled = VALUES(pushEnabled),
          emailEnabled = VALUES(emailEnabled),
          soundEnabled = VALUES(soundEnabled),
          updatedAt = NOW()
      `, [userId, pushEnabled, emailEnabled, soundEnabled]);

            res.status(200).json({
                success: true,
                message: '알림 설정이 업데이트되었습니다.',
                data: { pushEnabled, emailEnabled, soundEnabled }
            });
        } catch (error) {
            console.error('알림 설정 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '알림 설정 업데이트에 실패했습니다.'
            });
        }
    },

    // 알림 권한 요청
    requestNotificationPermission: async (req, res) => {
        try {
            const userId = req.user.id;

            const [settings] = await utils.executeQuery(
                'SELECT pushEnabled FROM notification_settings WHERE memberId = ?',
                [userId]
            );

            if (!settings?.pushEnabled) {
                return res.status(400).json({
                    success: false,
                    message: '알림 권한이 비활성화되어 있습니다.'
                });
            }

            res.status(200).json({
                success: true,
                data: { granted: true }
            });
        } catch (error) {
            console.error('알림 권한 요청 오류:', error);
            res.status(500).json({
                success: false,
                message: '알림 권한 요청에 실패했습니다.'
            });
        }
    },

    // 테마 설정 조회
    getThemeSettings: async (req, res) => {
        try {
            const userId = req.user.id;

            const [settings] = await utils.executeQuery(`
        SELECT theme, displayMode 
        FROM settings 
        WHERE memberId = ?
      `, [userId]);

            res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            console.error('테마 설정 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '테마 설정 조회에 실패했습니다.'
            });
        }
    },

    // 테마 설정 업데이트
    updateThemeSettings: async (req, res) => {
        try {
            const userId = req.user.id;
            const { theme } = req.body;

            if (!utils.validateTheme(theme)) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 테마입니다.'
                });
            }

            const result = await utils.executeQuery(`
        UPDATE settings
        SET theme = ?, updatedAt = NOW()
        WHERE memberId = ?
      `, [theme, userId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '설정을 찾을 수 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                message: '테마 설정이 업데이트되었습니다.',
                data: { theme }
            });
        } catch (error) {
            console.error('테마 설정 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '테마 설정 업데이트에 실패했습니다.'
            });
        }
    },

    // 앱 버전 조회
    getAppVersion: async (req, res) => {
        try {
            const [version] = await utils.executeQuery(`
        SELECT version, releaseDate, minVersion
        FROM app_versions
        ORDER BY releaseDate DESC
        LIMIT 1
      `);

            if (!version) {
                return res.status(404).json({
                    success: false,
                    message: '앱 버전 정보를 찾을 수 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                data: version
            });
        } catch (error) {
            console.error('앱 버전 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '앱 버전 조회에 실패했습니다.'
            });
        }
    },

    // 개인정보 설정 조회
    getPrivacySettings: async (req, res) => {
        try {
            const userId = req.user.id;

            const [settings] = await utils.executeQuery(`
        SELECT isPublic, allowMessages, showActivity, showProgress
        FROM privacy_settings
        WHERE memberId = ?
      `, [userId]);

            res.status(200).json({
                success: true,
                data: settings || {}
            });
        } catch (error) {
            console.error('개인정보 설정 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '개인정보 설정 조회에 실패했습니다.'
            });
        }
    },

    // 개인정보 설정 업데이트
    updatePrivacySettings: async (req, res) => {
        try {
            const userId = req.user.id;
            const { isPublic, allowMessages, showActivity, showProgress } = req.body;

            await utils.executeQuery(`
        INSERT INTO privacy_settings (
          memberId, isPublic, allowMessages, showActivity, showProgress, updatedAt
        ) VALUES (?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          isPublic = VALUES(isPublic),
          allowMessages = VALUES(allowMessages),
          showActivity = VALUES(showActivity),
          showProgress = VALUES(showProgress),
          updatedAt = NOW()
      `, [userId, isPublic, allowMessages, showActivity, showProgress]);

            res.status(200).json({
                success: true,
                message: '개인정보 설정이 업데이트되었습니다.',
                data: { isPublic, allowMessages, showActivity, showProgress }
            });
        } catch (error) {
            console.error('개인정보 설정 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '개인정보 설정 업데이트에 실패했습니다.'
            });
        }
    },

    // 시스템 설정 열기
    openSystemSettings: async (req, res) => {
        try {
            // 실제 구현은 클라이언트 측에서 처리해야 함
            res.status(200).json({
                success: true,
                message: '시스템 설정을 열 수 있는 링크나 지침을 제공하세요.'
            });
        } catch (error) {
            console.error('시스템 설정 열기 오류:', error);
            res.status(500).json({
                success: false,
                message: '시스템 설정을 여는데 실패했습니다.'
            });
        }
    },

    // 백업 설정 조회
    getBackupSettings: async (req, res) => {
        try {
            const userId = req.user.id;

            const [settings] = await utils.executeQuery(`
        SELECT autoBackup, backupInterval, lastBackupDate, backupLocation
        FROM backup_settings
        WHERE memberId = ?
      `, [userId]);

            res.status(200).json({
                success: true,
                data: settings || {}
            });
        } catch (error) {
            console.error('백업 설정 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '백업 설정 조회에 실패했습니다.'
            });
        }
    },

    // 자동 백업 설정 업데이트
    updateAutoBackup: async (req, res) => {
        try {
            const userId = req.user.id;
            const { enabled, interval } = req.body;

            if (!utils.validateBackupInterval(interval)) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 백업 주기입니다.'
                });
            }

            await utils.executeQuery(`
        INSERT INTO backup_settings (
          memberId, autoBackup, backupInterval, updatedAt
        ) VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          autoBackup = VALUES(autoBackup),
          backupInterval = VALUES(backupInterval),
          updatedAt = NOW()
      `, [userId, enabled, interval]);

            res.status(200).json({
                success: true,
                message: '자동 백업 설정이 업데이트되었습니다.',
                data: { enabled, interval }
            });
        } catch (error) {
            console.error('자동 백업 설정 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '자동 백업 설정 업데이트에 실패했습니다.'
            });
        }
    },

    // 설정 백업
    backupSettings: async (req, res) => {
        try {
            const userId = req.user.id;

            const settings = await utils.executeQuery('SELECT * FROM settings WHERE memberId = ?', [userId]);
            const backupData = JSON.stringify(settings);

            await utils.executeQuery(`
        INSERT INTO settings_backups (memberId, data, createdAt)
        VALUES (?, ?, NOW())
      `, [userId, backupData]);

            res.status(200).json({
                success: true,
                message: '설정이 백업되었습니다.',
                data: { timestamp: new Date() }
            });
        } catch (error) {
            console.error('설정 백업 오류:', error);
            res.status(500).json({
                success: false,
                message: '설정 백업에 실패했습니다.'
            });
        }
    },

    // 설정 복원
    restoreSettings: async (req, res) => {
        try {
            const userId = req.user.id;

            const [backup] = await utils.executeQuery(`
        SELECT data FROM settings_backups
        WHERE memberId = ?
        ORDER BY createdAt DESC
        LIMIT 1
      `, [userId]);

            if (!backup) {
                return res.status(404).json({
                    success: false,
                    message: '복원할 백업을 찾을 수 없습니다.'
                });
            }

            const settings = JSON.parse(backup.data);
            await utils.executeQuery('UPDATE settings SET ? WHERE memberId = ?', [settings, userId]);

            res.status(200).json({
                success: true,
                message: '설정이 복원되었습니다.'
            });
        } catch (error) {
            console.error('설정 복원 오류:', error);
            res.status(500).json({
                success: false,
                message: '설정 복원에 실패했습니다.'
            });
        }
    },

    // 시간 설정 조회
    getTimeSettings: async (req, res) => {
        try {
            const userId = req.user.id;
            const { title } = req.params;

            const [settings] = await utils.executeQuery(`
        SELECT title, startTime, endTime, enabled, days
        FROM time_settings
        WHERE memberId = ? AND title = ?
      `, [userId, title]);

            if (!settings) {
                return res.status(404).json({
                    success: false,
                    message: '시간 설정을 찾을 수 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            console.error('시간 설정 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '시간 설정 조회에 실패했습니다.'
            });
        }
    },

    // 시간 설정 업데이트
    updateTimeSettings: async (req, res) => {
        try {
            const userId = req.user.id;
            const { title } = req.params;
            const { startTime, endTime, enabled, days } = req.body;

            await utils.executeQuery(`
        INSERT INTO time_settings (
          memberId, title, startTime, endTime, enabled, days, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          startTime = VALUES(startTime),
          endTime = VALUES(endTime),
          enabled = VALUES(enabled),
          days = VALUES(days),
          updatedAt = NOW()
      `, [userId, title, startTime, endTime, enabled, JSON.stringify(days)]);

            res.status(200).json({
                success: true,
                message: '시간 설정이 업데이트되었습니다.',
                data: { title, startTime, endTime, enabled, days }
            });
        } catch (error) {
            console.error('시간 설정 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '시간 설정 업데이트에 실패했습니다.'
            });
        }
    }
};

module.exports = settingsController;