const db = require('../config/mysql');
const createError = require('http-errors');
const admin = require('firebase-admin');

const NotificationController = {
    // 알림 목록 조회
    getNotifications: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [notifications] = await connection.query(
                `SELECT n.*, u.name as sender_name, u.profile_image as sender_image
                 FROM notifications n
                          LEFT JOIN users u ON n.sender_id = u.id
                 WHERE n.user_id = ?
                 ORDER BY n.created_at DESC`,
                [req.user.id]
            );

            res.json({
                success: true,
                notifications
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 알림 읽음 처리
    markAsRead: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { notificationId } = req.params;

            const [result] = await connection.query(
                'UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?',
                [notificationId, req.user.id]
            );

            if (result.affectedRows === 0) {
                throw createError(404, '알림을 찾을 수 없습니다.');
            }

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 모든 알림 읽음 처리
    markAllAsRead: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            await connection.query(
                'UPDATE notifications SET is_read = true WHERE user_id = ? AND is_read = false',
                [req.user.id]
            );

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 알림 삭제
    deleteNotification: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { notificationId } = req.params;

            const [result] = await connection.query(
                'DELETE FROM notifications WHERE id = ? AND user_id = ?',
                [notificationId, req.user.id]
            );

            if (result.affectedRows === 0) {
                throw createError(404, '알림을 찾을 수 없습니다.');
            }

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // FCM 토큰 등록
    registerFCMToken: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { token } = req.body;

            await connection.beginTransaction();

            // 기존 토큰 삭제
            await connection.query(
                'DELETE FROM fcm_tokens WHERE user_id = ?',
                [req.user.id]
            );

            // 새 토큰 등록
            await connection.query(
                'INSERT INTO fcm_tokens (user_id, token) VALUES (?, ?)',
                [req.user.id, token]
            );

            await connection.commit();
            res.json({ success: true });
        } catch (err) {
            await connection.rollback();
            next(err);
        } finally {
            connection.release();
        }
    },

    // 푸시 알림 전송 (내부 메서드)
    sendPushNotification: async (userId, title, body, data = {}) => {
        try {
            const [tokens] = await db.query(
                'SELECT token FROM fcm_tokens WHERE user_id = ?',
                [userId]
            );

            if (!tokens.length) return;

            const message = {
                notification: {
                    title,
                    body
                },
                data,
                tokens: tokens.map(t => t.token)
            };

            await admin.messaging().sendMulticast(message);
        } catch (error) {
            console.error('Push notification error:', error);
        }
    }
};

module.exports = NotificationController;