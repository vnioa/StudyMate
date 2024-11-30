const db = require('../config/mysql');
const createError = require('http-errors');
const { uploadToStorage } = require('../utils/fileUpload');

const ChatController = {
    // 읽지 않은 메시지 수 조회
    getUnreadCount: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.query(
                'SELECT COUNT(*) as unreadCount FROM messages WHERE receiver_id = ? AND read_at IS NULL',
                [req.user.id]
            );
            res.json({ unreadCount: rows[0].unreadCount });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 채팅방 생성
    createChatRoom: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { type, participants } = req.body;

            const [result] = await connection.query(
                'INSERT INTO chat_rooms (type, created_by) VALUES (?, ?)',
                [type, req.user.id]
            );

            const roomId = result.insertId;
            const participantValues = [req.user.id, ...participants].map(
                userId => [roomId, userId]
            );

            await connection.query(
                'INSERT INTO room_participants (room_id, user_id) VALUES ?',
                [participantValues]
            );

            await connection.commit();
            res.json({ roomId });
        } catch (err) {
            await connection.rollback();
            next(err);
        } finally {
            connection.release();
        }
    },

    // 채팅방 목록 조회
    getChatRooms: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const [rooms] = await connection.query(
                `SELECT r.*, 
                (SELECT COUNT(*) FROM messages m 
                 WHERE m.room_id = r.id AND m.receiver_id = ? AND m.read_at IS NULL) as unread_count,
                (SELECT message FROM messages 
                 WHERE room_id = r.id ORDER BY created_at DESC LIMIT 1) as last_message,
                (SELECT created_at FROM messages 
                 WHERE room_id = r.id ORDER BY created_at DESC LIMIT 1) as last_message_at
         FROM chat_rooms r
         INNER JOIN room_participants rp ON r.id = rp.room_id
         WHERE rp.user_id = ?
         ORDER BY last_message_at DESC
         LIMIT ? OFFSET ?`,
                [req.user.id, req.user.id, parseInt(limit), offset]
            );

            const [totalCount] = await connection.query(
                'SELECT COUNT(*) as count FROM chat_rooms r INNER JOIN room_participants rp ON r.id = rp.room_id WHERE rp.user_id = ?',
                [req.user.id]
            );

            res.json({
                rooms,
                totalCount: totalCount[0].count
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 채팅방 상세 조회
    getChatRoom: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { roomId } = req.params;

            // 채팅방 정보 조회
            const [room] = await connection.query(
                'SELECT * FROM chat_rooms WHERE id = ?',
                [roomId]
            );

            if (!room.length) {
                throw createError(404, '채팅방을 찾을 수 없습니다.');
            }

            // 메시지 목록 조회
            const [messages] = await connection.query(
                'SELECT * FROM messages WHERE room_id = ? ORDER BY created_at DESC LIMIT 50',
                [roomId]
            );

            res.json({
                room: room[0],
                messages
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 메시지 전송
    sendMessage: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { roomId } = req.params;
            const { content, type } = req.body;

            const [result] = await connection.query(
                'INSERT INTO messages (room_id, sender_id, content, type) VALUES (?, ?, ?, ?)',
                [roomId, req.user.id, content, type]
            );

            res.json({
                messageId: result.insertId,
                sentAt: new Date()
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 메시지 읽음 처리
    markAsRead: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { roomId, messageId } = req.params;

            await connection.query(
                'UPDATE messages SET read_at = NOW() WHERE id = ? AND room_id = ? AND receiver_id = ?',
                [messageId, roomId, req.user.id]
            );

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 채팅방 나가기
    leaveRoom: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { roomId } = req.params;

            await connection.query(
                'DELETE FROM room_participants WHERE room_id = ? AND user_id = ?',
                [roomId, req.user.id]
            );

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 채팅방 검색
    searchRooms: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { query } = req.query;

            const [rooms] = await connection.query(
                `SELECT r.* FROM chat_rooms r
         INNER JOIN room_participants rp ON r.id = rp.room_id
         WHERE rp.user_id = ? AND r.name LIKE ?`,
                [req.user.id, `%${query}%`]
            );

            res.json({ rooms });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 이미지 메시지 전송
    sendImageMessage: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { roomId } = req.params;
            const imageUrl = await uploadToStorage(req.file);

            const [result] = await connection.query(
                'INSERT INTO messages (room_id, sender_id, content, type) VALUES (?, ?, ?, "image")',
                [roomId, req.user.id, imageUrl]
            );

            res.json({
                message: {
                    id: result.insertId,
                    type: 'image',
                    content: imageUrl,
                    sentAt: new Date()
                }
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 채팅방 설정 업데이트
    updateRoomSettings: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { roomId } = req.params;
            const { notification, encryption, theme, roomName } = req.body;

            await connection.query(
                `UPDATE chat_rooms 
         SET notification = ?, encryption = ?, theme = ?, name = ?
         WHERE id = ?`,
                [notification, encryption, theme, roomName, roomId]
            );

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    }
};

module.exports = ChatController;