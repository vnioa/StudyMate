const db = require('../config/mysql');
const redis = require('../config/redis');

class MessageController {
    // 메시지 전송
    async sendMessage(req, res) {
        try {
            const { roomId, content, type } = req.body;
            const userId = req.user.id;

            const [result] = await db.execute(
                'INSERT INTO chat_messages (room_id, user_id, content, type) VALUES (?, ?, ?, ?)',
                [roomId, userId, content, type]
            );

            // Redis에 메시지 캐싱
            await redis.cacheMessage(roomId, {
                id: result.insertId,
                userId,
                content,
                type,
                timestamp: new Date()
            });

            res.status(201).json({
                success: true,
                messageId: result.insertId
            });
        } catch (error) {
            console.error('메시지 전송 오류:', error);
            res.status(500).json({
                success: false,
                message: '메시지 전송에 실패했습니다.'
            });
        }
    }

    // 메시지 목록 조회
    async getMessages(req, res) {
        try {
            const { roomId } = req.params;
            const { page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;

            // 캐시된 메시지 먼저 확인
            const cachedMessages = await redis.getCachedMessages(roomId);

            if (cachedMessages.length > 0) {
                return res.status(200).json({
                    success: true,
                    messages: cachedMessages
                });
            }

            // DB에서 메시지 조회
            const [messages] = await db.execute(
                `SELECT m.*, u.username 
         FROM chat_messages m 
         JOIN users u ON m.user_id = u.id 
         WHERE m.room_id = ? 
         ORDER BY m.created_at DESC 
         LIMIT ? OFFSET ?`,
                [roomId, parseInt(limit), offset]
            );

            res.status(200).json({
                success: true,
                messages
            });
        } catch (error) {
            console.error('메시지 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '메시지 조회에 실패했습니다.'
            });
        }
    }

    // 메시지 삭제
    async deleteMessage(req, res) {
        try {
            const { messageId } = req.params;
            const userId = req.user.id;

            const [message] = await db.execute(
                'SELECT * FROM chat_messages WHERE id = ? AND user_id = ?',
                [messageId, userId]
            );

            if (message.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: '메시지를 삭제할 권한이 없습니다.'
                });
            }

            await db.execute('DELETE FROM chat_messages WHERE id = ?', [messageId]);

            res.status(200).json({
                success: true,
                message: '메시지가 삭제되었습니다.'
            });
        } catch (error) {
            console.error('메시지 삭제 오류:', error);
            res.status(500).json({
                success: false,
                message: '메시지 삭제에 실패했습니다.'
            });
        }
    }

    // 메시지 읽음 상태 업데이트
    async markAsRead(req, res) {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;

            await db.execute(
                'UPDATE chat_messages SET read_at = NOW() WHERE room_id = ? AND user_id != ?',
                [roomId, userId]
            );

            res.status(200).json({
                success: true,
                message: '메시지 읽음 상태가 업데이트되었습니다.'
            });
        } catch (error) {
            console.error('읽음 상태 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '읽음 상태 업데이트에 실패했습니다.'
            });
        }
    }
}

module.exports = new MessageController();