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

    validateDeviceType(deviceType) {
        const validTypes = ['web', 'android', 'ios'];
        return validTypes.includes(deviceType);
    }
};

const notificationController = {
    // 알림 목록 조회
    getNotifications: async (req, res) => {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20, type } = req.query;
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
            params.push(Number(limit), offset);

            const [notifications, [{total}]] = await Promise.all([
                utils.executeQuery(query, params),
                utils.executeQuery(
                    'SELECT COUNT(*) as total FROM notifications WHERE memberId = ? AND deletedAt IS NULL',
                    [userId]
                )
            ]);

            res.status(200).json({
                success: true,
                message: '알림 목록을 성공적으로 조회했습니다.',
                data: {
                    notifications,
                    total,
                    page: Number(page),
                    limit: Number(limit)
                }
            });
        } catch (error) {
            console.error('알림 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '알림 목록 조회에 실패했습니다.'
            });
        }
    },

    // 단일 알림 읽음 처리
    markAsRead: async (req, res) => {
        try {
            const { notificationId } = req.params;
            const userId = req.user.id;

            const result = await utils.executeQuery(`
        UPDATE notifications
        SET isRead = true, readAt = NOW()
        WHERE id = ? AND memberId = ? AND deletedAt IS NULL
      `, [notificationId, userId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '알림을 찾을 수 없거나 접근 권한이 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                message: '알림이 읽음 처리되었습니다.'
            });
        } catch (error) {
            console.error('알림 읽음 처리 오류:', error);
            res.status(500).json({
                success: false,
                message: '알림 읽음 처리에 실패했습니다.'
            });
        }
    },

    // 모든 알림 읽음 처리
    markAllAsRead: async (req, res) => {
        try {
            const userId = req.user.id;

            await utils.executeQuery(`
        UPDATE notifications
        SET isRead = true, readAt = NOW()
        WHERE memberId = ? 
        AND isRead = false 
        AND deletedAt IS NULL
      `, [userId]);

            res.status(200).json({
                success: true,
                message: '모든 알림이 읽음 처리되었습니다.'
            });
        } catch (error) {
            console.error('전체 알림 읽음 처리 오류:', error);
            res.status(500).json({
                success: false,
                message: '전체 알림 읽음 처리에 실패했습니다.'
            });
        }
    },

    // 알림 삭제
    deleteNotification: async (req, res) => {
        try {
            const { notificationId } = req.params;
            const userId = req.user.id;

            const result = await utils.executeQuery(`
        UPDATE notifications
        SET deletedAt = NOW()
        WHERE id = ? AND memberId = ? AND deletedAt IS NULL
      `, [notificationId, userId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '알림을 찾을 수 없거나 접근 권한이 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                message: '알림이 삭제되었습니다.'
            });
        } catch (error) {
            console.error('알림 삭제 오류:', error);
            res.status(500).json({
                success: false,
                message: '알림 삭제에 실패했습니다.'
            });
        }
    },

    // FCM 토큰 등록
    registerFCMToken: async (req, res) => {
        try {
            const userId = req.user.id;
            const { token, deviceType = 'web', deviceInfo } = req.body;

            if (!utils.validateDeviceType(deviceType)) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 기기 유형입니다.'
                });
            }

            await utils.executeTransaction(async (connection) => {
                await connection.execute(`
          UPDATE fcm_tokens
          SET isActive = false
          WHERE memberId = ? AND token = ?
        `, [userId, token]);

                await connection.execute(`
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
                    token,
                    deviceType,
                    JSON.stringify(deviceInfo || {})
                ]);
            });

            res.status(200).json({
                success: true,
                message: 'FCM 토큰이 등록되었습니다.'
            });
        } catch (error) {
            console.error('FCM 토큰 등록 오류:', error);
            res.status(500).json({
                success: false,
                message: 'FCM 토큰 등록에 실패했습니다.'
            });
        }
    }
};

module.exports = notificationController;