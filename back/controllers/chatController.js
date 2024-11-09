const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

exports.getChatList = async (req, res) => {
    const userId = req.user.id;
    try {
        const [chatRooms] = await db.execute(`
            SELECT
                cr.id,
                cr.name,
                cr.last_message,
                cr.last_message_time,
                (SELECT COUNT(*) FROM messages m WHERE m.chat_room_id = cr.id AND m.user_id != ? AND m.created_at > cru.last_read_time) as unread_count,
                u.profile_image
            FROM chat_rooms cr
                JOIN chat_room_users cru ON cr.id = cru.chat_room_id
                LEFT JOIN users u ON cr.last_message_user_id = u.id
            WHERE cru.user_id = ?
            ORDER BY cr.last_message_time DESC
        `, [userId, userId]);

        res.status(200).json({ success: true, chatRooms });
    } catch (error) {
        console.error('채팅방 목록 조회 오류:', error);
        res.status(500).json({ success: false, message: '채팅방 목록 조회에 실패했습니다.' });
    }
};

exports.createChatRoom = async (req, res) => {
    const { name, participants } = req.body;
    const userId = req.user.id;

    if (!name || !participants || !Array.isArray(participants)) {
        return res.status(400).json({ success: false, message: '잘못된 요청 형식입니다.' });
    }

    try {
        await db.beginTransaction();

        const [result] = await db.execute('INSERT INTO chat_rooms (name) VALUES (?)', [name]);
        const chatRoomId = result.insertId;

        const participantIds = [userId, ...participants];
        for (let participantId of participantIds) {
            await db.execute('INSERT INTO chat_room_users (chat_room_id, user_id) VALUES (?, ?)', [chatRoomId, participantId]);
        }

        await db.commit();
        res.status(201).json({ success: true, message: '채팅방이 생성되었습니다.', chatRoomId });
    } catch (error) {
        await db.rollback();
        console.error('채팅방 생성 오류:', error);
        res.status(500).json({ success: false, message: '채팅방 생성에 실패했습니다.' });
    }
};

exports.sendMessage = async (req, res) => {
    const { chatRoomId, content, type = 'text' } = req.body;
    const userId = req.user.id;

    try {
        const [chatRoom] = await db.execute('SELECT * FROM chat_rooms WHERE id = ?', [chatRoomId]);
        if (chatRoom.length === 0) {
            return res.status(404).json({ success: false, message: '채팅방을 찾을 수 없습니다.' });
        }

        const [result] = await db.execute(
            'INSERT INTO messages (chat_room_id, user_id, content, type) VALUES (?, ?, ?, ?)',
            [chatRoomId, userId, content, type]
        );

        await db.execute(
            'UPDATE chat_rooms SET last_message = ?, last_message_time = NOW(), last_message_user_id = ? WHERE id = ?',
            [content, userId, chatRoomId]
        );

        // 읽지 않은 메시지 수 업데이트
        await db.execute(
            'UPDATE chat_room_users SET unread_count = unread_count + 1 WHERE chat_room_id = ? AND user_id != ?',
            [chatRoomId, userId]
        );

        res.status(201).json({ success: true, message: '메시지가 전송되었습니다.', messageId: result.insertId });
    } catch (error) {
        console.error('메시지 전송 오류:', error);
        res.status(500).json({ success: false, message: '메시지 전송에 실패했습니다.' });
    }
};

exports.getMessages = async (req, res) => {
    const { chatRoomId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const [messages] = await db.execute(
            `SELECT m.*, u.username, u.profile_image 
        FROM messages m 
       JOIN users u ON m.user_id = u.id 
       WHERE m.chat_room_id = ? 
       ORDER BY m.created_at DESC 
       LIMIT ? OFFSET ?`,
            [chatRoomId, Number(limit), offset]
        );

        // 읽음 상태 업데이트
        await db.execute(
            'UPDATE chat_room_users SET last_read_time = NOW(), unread_count = 0 WHERE user_id = ? AND chat_room_id = ?',
            [userId, chatRoomId]
        );

        res.status(200).json({ success: true, messages: messages.reverse() });
    } catch (error) {
        console.error('메시지 조회 오류:', error);
        res.status(500).json({ success: false, message: '메시지 조회에 실패했습니다.' });
    }
};

exports.updateMessageStatus = async (req, res) => {
    const { messageId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    try {
        await db.execute(
            'UPDATE messages SET status = ? WHERE id = ? AND user_id = ?',
            [status, messageId, userId]
        );
        res.status(200).json({ success: true, message: '메시지 상태가 업데이트되었습니다.' });
    } catch (error) {
        console.error('메시지 상태 업데이트 오류:', error);
        res.status(500).json({ success: false, message: '메시지 상태 업데이트에 실패했습니다.' });
    }
};

exports.deleteMessage = async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.id;

    try {
        const [message] = await db.execute('SELECT * FROM messages WHERE id = ? AND user_id = ?', [messageId, userId]);
        if (message.length === 0) {
            return res.status(404).json({ success: false, message: '메시지를 찾을 수 없습니다.' });
        }

        await db.execute('DELETE FROM messages WHERE id = ?', [messageId]);
        res.status(200).json({ success: true, message: '메시지가 삭제되었습니다.' });
    } catch (error) {
        console.error('메시지 삭제 오류:', error);
        res.status(500).json({ success: false, message: '메시지 삭제에 실패했습니다.' });
    }
};

exports.leaveChatRoom = async (req, res) => {
    const { chatRoomId } = req.params;
    const userId = req.user.id;

    try {
        await db.execute('DELETE FROM chat_room_users WHERE chat_room_id = ? AND user_id = ?', [chatRoomId, userId]);
        res.status(200).json({ success: true, message: '채팅방을 나갔습니다.' });
    } catch (error) {
        console.error('채팅방 나가기 오류:', error);
        res.status(500).json({ success: false, message: '채팅방 나가기에 실패했습니다.' });
    }
};

exports.inviteToChat = async (req, res) => {
    const { chatRoomId } = req.params;
    const { userIds } = req.body;
    const inviterId = req.user.id;

    if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({ success: false, message: '잘못된 요청 형식입니다.' });
    }

    try {
        for (let userId of userIds) {
            await db.execute('INSERT INTO chat_room_users (chat_room_id, user_id) VALUES (?, ?)', [chatRoomId, userId]);
        }
        res.status(200).json({ success: true, message: '사용자들이 채팅방에 초대되었습니다.' });
    } catch (error) {
        console.error('채팅방 초대 오류:', error);
        res.status(500).json({ success: false, message: '채팅방 초대에 실패했습니다.' });
    }
};