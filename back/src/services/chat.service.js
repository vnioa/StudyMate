const db = require('../config/mysql');
const redis = require('../config/redis');

class ChatService {
    // 메시지 전송
    async sendMessage(userId, roomId, messageData) {
        try {
            const { content, type } = messageData;

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

            return result.insertId;
        } catch (error) {
            console.error('메시지 전송 오류:', error);
            throw error;
        }
    }

    // 채팅방 생성
    async createChatRoom(creatorId, roomData) {
        try {
            const { name, type, participants } = roomData;

            const [result] = await db.execute(
                'INSERT INTO chat_rooms (name, type, creator_id) VALUES (?, ?, ?)',
                [name, type, creatorId]
            );

            const roomId = result.insertId;

            // 참여자 추가
            for (const userId of participants) {
                await db.execute(
                    'INSERT INTO chat_participants (room_id, user_id) VALUES (?, ?)',
                    [roomId, userId]
                );
            }

            return roomId;
        } catch (error) {
            console.error('채팅방 생성 오류:', error);
            throw error;
        }
    }

    // 채팅방 목록 조회
    async getChatRooms(userId) {
        try {
            const [rooms] = await db.execute(
                `SELECT r.*, 
                COUNT(DISTINCT m.id) as message_count,
                COUNT(DISTINCT CASE WHEN m.read_at IS NULL AND m.user_id != ? THEN m.id END) as unread_count
         FROM chat_rooms r
         JOIN chat_participants p ON r.id = p.room_id
         LEFT JOIN chat_messages m ON r.id = m.room_id
         WHERE p.user_id = ?
         GROUP BY r.id
         ORDER BY r.updated_at DESC`,
                [userId, userId]
            );

            return rooms;
        } catch (error) {
            console.error('채팅방 목록 조회 오류:', error);
            throw error;
        }
    }

    // 메시지 목록 조회
    async getMessages(roomId, page = 1, limit = 50) {
        try {
            const offset = (page - 1) * limit;

            const [messages] = await db.execute(
                `SELECT m.*, u.username 
         FROM chat_messages m 
         JOIN users u ON m.user_id = u.id 
         WHERE m.room_id = ? 
         ORDER BY m.created_at DESC 
         LIMIT ? OFFSET ?`,
                [roomId, limit, offset]
            );

            return messages;
        } catch (error) {
            console.error('메시지 목록 조회 오류:', error);
            throw error;
        }
    }

    // 채팅방 참여자 관리
    async manageParticipants(roomId, action, userIds) {
        try {
            if (action === 'add') {
                for (const userId of userIds) {
                    await db.execute(
                        'INSERT INTO chat_participants (room_id, user_id) VALUES (?, ?)',
                        [roomId, userId]
                    );
                }
            } else if (action === 'remove') {
                for (const userId of userIds) {
                    await db.execute(
                        'DELETE FROM chat_participants WHERE room_id = ? AND user_id = ?',
                        [roomId, userId]
                    );
                }
            }

            return true;
        } catch (error) {
            console.error('참여자 관리 오류:', error);
            throw error;
        }
    }
}

module.exports = new ChatService();