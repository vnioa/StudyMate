const { dbUtils } = require('../config/db');

const notificationService = {
    // 알림 목록 조회
    async getNotifications(userId, options = {}) {
        try {
            const { page = 1, limit = 20, type } = options;
            const offset = (page - 1) * limit;

            let query = `
                SELECT n.*, u.username as senderName
                FROM notifications n
                LEFT JOIN auth u ON n.senderId = u.id
                WHERE n.memberId = ?
                AND n.deletedAt IS NULL
            `;

            const params = [userId];

            if (type) {
                query += ' AND n.type = ?';
                params.push(type);
            }

            query += ` ORDER BY n.createdAt DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const notifications = await dbUtils.query(query, params);

            const [{ total }] = await dbUtils.query(
                'SELECT COUNT(*) as total FROM notifications WHERE memberId = ? AND deletedAt IS NULL',
                [userId]
            );

            return {
                notifications,
                total,
                page,
                limit
            };
        } catch (error) {
            throw new Error('알림 목록 조회 실패: ' + error.message);
        }
    },

    // 단일 알림 읽음 처리
    async markNotificationAsRead(notificationId, userId) {
        try {
            const result = await dbUtils.query(`
                UPDATE notifications
                SET isRead = true, readAt = NOW()
                WHERE id = ? AND memberId = ? AND deletedAt IS NULL
            `, [notificationId, userId]);

            if (result.affectedRows === 0) {
                throw new Error('알림을 찾을 수 없거나 접근 권한이 없습니다.');
            }
        } catch (error) {
            throw new Error('알림 읽음 처리 실패: ' + error.message);
        }
    },

    // 모든 알림 읽음 처리
    async markAllNotificationsAsRead(userId) {
        try {
            await dbUtils.query(`
                UPDATE notifications
                SET isRead = true, readAt = NOW()
                WHERE memberId = ? 
                AND isRead = false 
                AND deletedAt IS NULL
            `, [userId]);
        } catch (error) {
            throw new Error('전체 알림 읽음 처리 실패: ' + error.message);
        }
    },

    // 알림 삭제
    async deleteNotification(notificationId, userId) {
        try {
            const result = await dbUtils.query(`
                UPDATE notifications
                SET deletedAt = NOW()
                WHERE id = ? AND memberId = ? AND deletedAt IS NULL
            `, [notificationId, userId]);

            if (result.affectedRows === 0) {
                throw new Error('알림을 찾을 수 없거나 접근 권한이 없습니다.');
            }
        } catch (error) {
            throw new Error('알림 삭제 실패: ' + error.message);
        }
    },

    // FCM 토큰 등록
    async registerFCMToken(userId, tokenData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 기존 토큰 비활성화
                await connection.query(`
                    UPDATE fcm_tokens
                    SET isActive = false
                    WHERE memberId = ? AND token = ?
                `, [userId, tokenData.token]);

                // 새 토큰 등록
                await connection.query(`
                    INSERT INTO fcm_tokens (
                        memberId, token, deviceType, 
                        deviceInfo, isActive, lastUsed
                    ) VALUES (?, ?, ?, ?, true, NOW())
                    ON DUPLICATE KEY UPDATE
                        deviceType = VALUES(deviceType),
                        deviceInfo = VALUES(deviceInfo),
                        isActive = true,
                        lastUsed = NOW()
                `, [
                    userId,
                    tokenData.token,
                    tokenData.deviceType,
                    JSON.stringify(tokenData.deviceInfo || {})
                ]);

                return { success: true };
            } catch (error) {
                throw new Error('FCM 토큰 등록 실패: ' + error.message);
            }
        });
    },

    // 알림 전송 (내부 메서드)
    async sendNotification(notification) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [result] = await connection.query(`
                    INSERT INTO notifications (
                        memberId, type, title, content,
                        data, priority, expiresAt, createdAt
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                `, [
                    notification.memberId,
                    notification.type,
                    notification.title,
                    notification.content,
                    JSON.stringify(notification.data || {}),
                    notification.priority || 'medium',
                    notification.expiresAt
                ]);

                // FCM 토큰 조회
                const tokens = await connection.query(`
                    SELECT token, deviceType
                    FROM fcm_tokens
                    WHERE memberId = ? AND isActive = true
                `, [notification.memberId]);

                // FCM 푸시 알림 전송 로직 구현 필요

                return { id: result.insertId, ...notification };
            } catch (error) {
                throw new Error('알림 전송 실패: ' + error.message);
            }
        });
    }
};

module.exports = notificationService;