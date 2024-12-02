const { Notification, FCMToken, NotificationSetting } = require('../models');
const { dbUtils } = require('../config/db');
const admin = require('firebase-admin');

const notificationService = {
    // 알림 목록 조회
    async getNotifications(userId) {
        try {
            const query = `
                SELECT n.*, ns.pushNotifications, ns.emailNotifications
                FROM notifications n
                LEFT JOIN notification_settings ns ON n.userId = ns.userId
                WHERE n.userId = ?
                ORDER BY n.createdAt DESC
            `;
            const notifications = await dbUtils.query(query, [userId]);

            return { notifications };
        } catch (error) {
            throw new Error('알림 목록 조회 실패: ' + error.message);
        }
    },

    // 알림 읽음 처리
    async markAsRead(notificationId, userId) {
        try {
            const query = `
                UPDATE notifications 
                SET isRead = true, readAt = NOW()
                WHERE id = ? AND userId = ?
            `;
            const result = await dbUtils.query(query, [notificationId, userId]);

            if (result.affectedRows === 0) {
                throw new Error('알림을 찾을 수 없습니다');
            }

            return { success: true };
        } catch (error) {
            throw new Error('알림 읽음 처리 실패: ' + error.message);
        }
    },

    // 모든 알림 읽음 처리
    async markAllAsRead(userId) {
        try {
            const query = `
                UPDATE notifications 
                SET isRead = true, readAt = NOW()
                WHERE userId = ? AND isRead = false
            `;
            await dbUtils.query(query, [userId]);

            return { success: true };
        } catch (error) {
            throw new Error('전체 알림 읽음 처리 실패: ' + error.message);
        }
    },

    // 알림 삭제
    async deleteNotification(notificationId, userId) {
        try {
            const query = `
                DELETE FROM notifications 
                WHERE id = ? AND userId = ?
            `;
            const result = await dbUtils.query(query, [notificationId, userId]);

            if (result.affectedRows === 0) {
                throw new Error('알림을 찾을 수 없습니다');
            }

            return { success: true };
        } catch (error) {
            throw new Error('알림 삭제 실패: ' + error.message);
        }
    },

    // FCM 토큰 등록
    async registerFCMToken(token, userId, deviceType) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 기존 토큰 비활성화
                await connection.query(`
                    UPDATE fcm_tokens 
                    SET isActive = false 
                    WHERE userId = ? AND deviceType = ?
                `, [userId, deviceType]);

                // 새 토큰 등록
                await connection.query(`
                    INSERT INTO fcm_tokens (userId, token, deviceType)
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                    isActive = true, lastUsed = NOW()
                `, [userId, token, deviceType]);

                return { success: true };
            } catch (error) {
                throw new Error('FCM 토큰 등록 실패: ' + error.message);
            }
        });
    },

    // 알림 전송
    async sendNotification(userId, data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 알림 설정 확인
                const [settings] = await connection.query(`
                    SELECT * FROM notification_settings 
                    WHERE userId = ?
                `, [userId]);

                if (!settings || !settings[data.type + 'Notifications']) {
                    return { success: false, reason: '알림이 비활성화되어 있습니다' };
                }

                // 알림 저장
                const [result] = await connection.query(`
                    INSERT INTO notifications 
                    (userId, type, title, content, data, priority)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    userId,
                    data.type,
                    data.title,
                    data.content,
                    JSON.stringify(data.data || {}),
                    data.priority || 'medium'
                ]);

                // FCM 토큰 조회
                if (settings.pushNotifications) {
                    const tokens = await connection.query(`
                        SELECT token FROM fcm_tokens
                        WHERE userId = ? AND isActive = true
                    `, [userId]);

                    // FCM 메시지 전송
                    if (tokens.length > 0) {
                        const message = {
                            notification: {
                                title: data.title,
                                body: data.content
                            },
                            data: data.data || {},
                            tokens: tokens.map(t => t.token)
                        };

                        await admin.messaging().sendMulticast(message);
                    }
                }

                return { success: true, notificationId: result.insertId };
            } catch (error) {
                throw new Error('알림 전송 실패: ' + error.message);
            }
        });
    }
};

module.exports = notificationService;