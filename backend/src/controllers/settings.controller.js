const db = require('../config/mysql');
const createError = require('http-errors');

const SettingsController = {
    // 디스플레이 모드 관련
    getCurrentDisplayMode: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [settings] = await connection.query(
                'SELECT display_mode as mode FROM user_settings WHERE user_id = ?',
                [req.user.id]
            );

            res.json({ mode: settings[0]?.mode || 'light' });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    getDisplaySettings: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [settings] = await connection.query(
                'SELECT auto_mode, schedule_start, schedule_end FROM display_settings WHERE user_id = ?',
                [req.user.id]
            );

            res.json({
                autoMode: settings[0]?.auto_mode || false,
                schedule: {
                    start: settings[0]?.schedule_start,
                    end: settings[0]?.schedule_end
                }
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 폰트 설정 관련
    getFontSettings: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [settings] = await connection.query(
                'SELECT font_size, preview_text FROM font_settings WHERE user_id = ?',
                [req.user.id]
            );

            res.json({
                fontSize: settings[0]?.font_size || 16,
                previewText: settings[0]?.preview_text || '텍스트 미리보기'
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    updateFontSettings: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { fontSize, applyGlobally } = req.body;

            await connection.query(
                `INSERT INTO font_settings (user_id, font_size, apply_globally) 
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         font_size = VALUES(font_size),
         apply_globally = VALUES(apply_globally)`,
                [req.user.id, fontSize, applyGlobally]
            );

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 알림 설정 관련
    getNotificationSettings: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [settings] = await connection.query(
                `SELECT push_enabled, email_enabled, sound_enabled 
         FROM notification_settings 
         WHERE user_id = ?`,
                [req.user.id]
            );

            res.json({
                notifications: {
                    pushEnabled: settings[0]?.push_enabled || false,
                    emailEnabled: settings[0]?.email_enabled || false,
                    soundEnabled: settings[0]?.sound_enabled || false
                }
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    updateNotificationSettings: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { pushEnabled, emailEnabled, soundEnabled } = req.body;

            await connection.query(
                `INSERT INTO notification_settings 
         (user_id, push_enabled, email_enabled, sound_enabled)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         push_enabled = VALUES(push_enabled),
         email_enabled = VALUES(email_enabled),
         sound_enabled = VALUES(sound_enabled)`,
                [req.user.id, pushEnabled, emailEnabled, soundEnabled]
            );

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 개인정보 설정 관련
    getPrivacySettings: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [settings] = await connection.query(
                `SELECT is_public, allow_messages, show_activity, show_progress
         FROM privacy_settings
         WHERE user_id = ?`,
                [req.user.id]
            );

            res.json({
                isPublic: settings[0]?.is_public || false,
                allowMessages: settings[0]?.allow_messages || false,
                showActivity: settings[0]?.show_activity || false,
                showProgress: settings[0]?.show_progress || false
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    updatePrivacySettings: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { isPublic, allowMessages, showActivity, showProgress } = req.body;

            await connection.query(
                `INSERT INTO privacy_settings 
         (user_id, is_public, allow_messages, show_activity, show_progress)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         is_public = VALUES(is_public),
         allow_messages = VALUES(allow_messages),
         show_activity = VALUES(show_activity),
         show_progress = VALUES(show_progress)`,
                [req.user.id, isPublic, allowMessages, showActivity, showProgress]
            );

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 시간 설정 관련
    getTimeSettings: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { title } = req.params;
            const [settings] = await connection.query(
                `SELECT start_time, end_time, is_enabled, days
         FROM time_settings
         WHERE user_id = ? AND title = ?`,
                [req.user.id, title]
            );

            if (!settings.length) {
                return res.json({
                    startTime: null,
                    endTime: null,
                    enabled: false,
                    days: []
                });
            }

            res.json({
                startTime: settings[0].start_time,
                endTime: settings[0].end_time,
                enabled: settings[0].is_enabled,
                days: JSON.parse(settings[0].days)
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    }
};

module.exports = SettingsController;