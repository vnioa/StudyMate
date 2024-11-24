const db = require('../config/mysql');
const redis = require('../config/redis');

class RoomController {
    // 채팅방 생성
    async createRoom(req, res) {
        try {
            const { name, type, participants } = req.body;
            const creatorId = req.user.id;

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

            // 생성자도 참여자로 추가
            await db.execute(
                'INSERT INTO chat_participants (room_id, user_id, role) VALUES (?, ?, ?)',
                [roomId, creatorId, 'admin']
            );

            res.status(201).json({
                success: true,
                roomId,
                message: '채팅방이 생성되었습니다.'
            });
        } catch (error) {
            console.error('채팅방 생성 오류:', error);
            res.status(500).json({
                success: false,
                message: '채팅방 생성에 실패했습니다.'
            });
        }
    }

    // 채팅방 목록 조회
    async getRooms(req, res) {
        try {
            const userId = req.user.id;
            const { search } = req.query;

            let query = `
        SELECT r.*, 
               COUNT(DISTINCT m.id) as message_count,
               COUNT(DISTINCT CASE WHEN m.read_at IS NULL AND m.user_id != ? THEN m.id END) as unread_count
        FROM chat_rooms r
        JOIN chat_participants p ON r.id = p.room_id
        LEFT JOIN chat_messages m ON r.id = m.room_id
        WHERE p.user_id = ?
      `;
            const params = [userId, userId];

            if (search) {
                query += ' AND r.name LIKE ?';
                params.push(`%${search}%`);
            }

            query += ' GROUP BY r.id ORDER BY r.updated_at DESC';

            const [rooms] = await db.execute(query, params);

            res.status(200).json({
                success: true,
                rooms
            });
        } catch (error) {
            console.error('채팅방 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '채팅방 목록 조회에 실패했습니다.'
            });
        }
    }

    // 채팅방 설정 업데이트
    async updateRoom(req, res) {
        try {
            const { roomId } = req.params;
            const { name, notification, theme } = req.body;
            const userId = req.user.id;

            // 권한 확인
            const [admin] = await db.execute(
                'SELECT * FROM chat_participants WHERE room_id = ? AND user_id = ? AND role = ?',
                [roomId, userId, 'admin']
            );

            if (admin.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: '채팅방 설정을 변경할 권한이 없습니다.'
                });
            }

            await db.execute(
                'UPDATE chat_rooms SET name = ?, notification = ?, theme = ? WHERE id = ?',
                [name, notification, theme, roomId]
            );

            res.status(200).json({
                success: true,
                message: '채팅방 설정이 업데이트되었습니다.'
            });
        } catch (error) {
            console.error('채팅방 설정 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '채팅방 설정 업데이트에 실패했습니다.'
            });
        }
    }

    // 채팅방 나가기
    async leaveRoom(req, res) {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;

            await db.execute(
                'DELETE FROM chat_participants WHERE room_id = ? AND user_id = ?',
                [roomId, userId]
            );

            res.status(200).json({
                success: true,
                message: '채팅방을 나갔습니다.'
            });
        } catch (error) {
            console.error('채팅방 나가기 오류:', error);
            res.status(500).json({
                success: false,
                message: '채팅방 나가기에 실패했습니다.'
            });
        }
    }
}

module.exports = new RoomController();