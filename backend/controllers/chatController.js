const db = require('../config/db');

// 읽지 않은 메시지 수 조회
const getUnreadCount = async (req, res) => {
    try {
        const [result] = await db.execute(
            'SELECT COUNT(*) as unreadCount FROM messages WHERE recipient_id = ? AND read_at IS NULL',
            [req.user.id]
        );
        res.status(200).json({
            unreadCount: result[0].unreadCount
        });
    } catch (error) {
        console.error('읽지 않은 메시지 수 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '읽지 않은 메시지 수 조회에 실패했습니다.'
        });
    }
};

// 채팅방 생성
const createChatRoom = async (req, res) => {
    const { type, participants } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO chat_rooms (type, created_by) VALUES (?, ?)',
            [type, req.user.id]
        );

        if (participants) {
            await Promise.all(participants.map(participantId =>
                db.execute(
                    'INSERT INTO chat_room_participants (room_id, user_id) VALUES (?, ?)',
                    [result.insertId, participantId]
                )
            ));
        }

        res.status(201).json({
            roomId: result.insertId
        });
    } catch (error) {
        console.error('채팅방 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '채팅방 생성에 실패했습니다.'
        });
    }
};

// 채팅방 목록 조회
const getChatRooms = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    try {
        const [rooms] = await db.execute(
            `SELECT r.*, COUNT(m.message_id) as unread_count 
             FROM chat_rooms r 
             LEFT JOIN messages m ON r.room_id = m.room_id AND m.read_at IS NULL 
             WHERE r.room_id IN (SELECT room_id FROM chat_room_participants WHERE user_id = ?)
             GROUP BY r.room_id
             LIMIT ? OFFSET ?`,
            [req.user.id, limit, (page - 1) * limit]
        );

        const [total] = await db.execute(
            'SELECT COUNT(*) as total FROM chat_room_participants WHERE user_id = ?',
            [req.user.id]
        );

        res.status(200).json({
            rooms,
            totalCount: total[0].total
        });
    } catch (error) {
        console.error('채팅방 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '채팅방 목록 조회에 실패했습니다.'
        });
    }
};

// 채팅방 상세 조회
const getChatRoom = async (req, res) => {
    const { roomId } = req.params;
    try {
        const [room] = await db.execute(
            'SELECT * FROM chat_rooms WHERE room_id = ?',
            [roomId]
        );

        const [messages] = await db.execute(
            'SELECT * FROM messages WHERE room_id = ? ORDER BY created_at DESC LIMIT 50',
            [roomId]
        );

        res.status(200).json({
            room: room[0],
            messages
        });
    } catch (error) {
        console.error('채팅방 상세 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '채팅방 상세 조회에 실패했습니다.'
        });
    }
};

// 메시지 전송
const sendMessage = async (req, res) => {
    const { roomId } = req.params;
    const { content, type } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO messages (room_id, sender_id, content, type) VALUES (?, ?, ?, ?)',
            [roomId, req.user.id, content, type]
        );

        res.status(201).json({
            messageId: result.insertId,
            sentAt: new Date()
        });
    } catch (error) {
        console.error('메시지 전송 오류:', error);
        res.status(500).json({
            success: false,
            message: '메시지 전송에 실패했습니다.'
        });
    }
};

// 메시지 읽음 처리
const markAsRead = async (req, res) => {
    const { roomId, messageId } = req.params;
    try {
        await db.execute(
            'UPDATE messages SET read_at = NOW() WHERE room_id = ? AND message_id = ?',
            [roomId, messageId]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('메시지 읽음 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '메시지 읽음 처리에 실패했습니다.'
        });
    }
};

// 채팅방 나가기
const leaveRoom = async (req, res) => {
    const { roomId } = req.params;
    try {
        await db.execute(
            'DELETE FROM chat_room_participants WHERE room_id = ? AND user_id = ?',
            [roomId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('채팅방 나가기 오류:', error);
        res.status(500).json({
            success: false,
            message: '채팅방 나가기에 실패했습니다.'
        });
    }
};

// 채팅방 검색
const searchRooms = async (req, res) => {
    const { query } = req.query;
    try {
        const [rooms] = await db.execute(
            `SELECT * FROM chat_rooms WHERE name LIKE ? AND room_id IN 
            (SELECT room_id FROM chat_room_participants WHERE user_id = ?)`,
            [`%${query}%`, req.user.id]
        );
        res.status(200).json({ rooms });
    } catch (error) {
        console.error('채팅방 검색 오류:', error);
        res.status(500).json({
            success: false,
            message: '채팅방 검색에 실패했습니다.'
        });
    }
};

// 채팅방 고정/해제
const pinChatRoom = async (req, res) => {
    const { roomId } = req.params;
    const { isPinned } = req.body;
    try {
        await db.execute(
            'UPDATE chat_room_participants SET is_pinned = ? WHERE room_id = ? AND user_id = ?',
            [isPinned, roomId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('채팅방 고정 설정 오류:', error);
        res.status(500).json({
            success: false,
            message: '채팅방 고정 설정에 실패했습니다.'
        });
    }
};

// 채팅방 삭제
const deleteRoom = async (req, res) => {
    const { roomId } = req.params;
    try {
        await db.execute('DELETE FROM chat_rooms WHERE room_id = ?', [roomId]);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('채팅방 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '채팅방 삭제에 실패했습니다.'
        });
    }
};

// 채팅방 정보 조회
const getRoomInfo = async (req, res) => {
    const { roomId } = req.params;
    try {
        const [roomInfo] = await db.execute(
            'SELECT * FROM chat_rooms WHERE room_id = ?',
            [roomId]
        );
        res.status(200).json({ roomInfo: roomInfo[0] });
    } catch (error) {
        console.error('채팅방 정보 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '채팅방 정보 조회에 실패했습니다.'
        });
    }
};

// 이미지 메시지 전송
const sendImageMessage = async (req, res) => {
    const { roomId } = req.params;
    try {
        // 이미지 업로드 처리 로직
        const imageUrl = '이미지 업로드 후 URL';
        const [result] = await db.execute(
            'INSERT INTO messages (room_id, sender_id, content, type) VALUES (?, ?, ?, "image")',
            [roomId, req.user.id, imageUrl]
        );
        res.status(201).json({
            message: {
                messageId: result.insertId,
                imageUrl
            }
        });
    } catch (error) {
        console.error('이미지 메시지 전송 오류:', error);
        res.status(500).json({
            success: false,
            message: '이미지 메시지 전송에 실패했습니다.'
        });
    }
};

// 채팅방 설정 업데이트
const updateRoomSettings = async (req, res) => {
    const { roomId } = req.params;
    const { notification, encryption, theme } = req.body;
    try {
        await db.execute(
            'UPDATE chat_rooms SET notification = ?, encryption = ?, theme = ? WHERE room_id = ?',
            [notification, encryption, theme, roomId]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('채팅방 설정 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '채팅방 설정 업데이트에 실패했습니다.'
        });
    }
};

// 채팅방 이름 변경
const updateRoomName = async (req, res) => {
    const { roomId } = req.params;
    const { roomName } = req.body;
    try {
        await db.execute(
            'UPDATE chat_rooms SET name = ? WHERE room_id = ?',
            [roomName, roomId]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('채팅방 이름 변경 오류:', error);
        res.status(500).json({
            success: false,
            message: '채팅방 이름 변경에 실패했습니다.'
        });
    }
};

// 채팅방 참여자 관리
const updateParticipants = async (req, res) => {
    const { roomId } = req.params;
    const { participants } = req.body;
    try {
        await db.execute('DELETE FROM chat_room_participants WHERE room_id = ?', [roomId]);
        await Promise.all(participants.map(participantId =>
            db.execute(
                'INSERT INTO chat_room_participants (room_id, user_id) VALUES (?, ?)',
                [roomId, participantId]
            )
        ));
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('참여자 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '참여자 업데이트에 실패했습니다.'
        });
    }
};

// 메시지 중요 표시 토글
const toggleImportant = async (req, res) => {
    const { messageId } = req.params;
    try {
        const [message] = await db.execute(
            'SELECT is_important FROM messages WHERE message_id = ?',
            [messageId]
        );
        const newStatus = !message[0].is_important;
        await db.execute(
            'UPDATE messages SET is_important = ? WHERE message_id = ?',
            [newStatus, messageId]
        );
        res.status(200).json({
            success: true,
            isImportant: newStatus
        });
    } catch (error) {
        console.error('메시지 중요 표시 토글 오류:', error);
        res.status(500).json({
            success: false,
            message: '메시지 중요 표시 변경에 실패했습니다.'
        });
    }
};

// 채팅방 상세 정보 조회
const getRoomDetail = async (req, res) => {
    const { roomId } = req.params;
    try {
        const [roomInfo] = await db.execute(
            'SELECT * FROM chat_rooms WHERE room_id = ?',
            [roomId]
        );
        const [participants] = await db.execute(
            'SELECT u.* FROM users u JOIN chat_room_participants p ON u.user_id = p.user_id WHERE p.room_id = ?',
            [roomId]
        );
        res.status(200).json({
            roomInfo: {
                ...roomInfo[0],
                participants
            }
        });
    } catch (error) {
        console.error('채팅방 상세 정보 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '채팅방 상세 정보 조회에 실패했습니다.'
        });
    }
};

module.exports = {
    getUnreadCount,
    createChatRoom,
    getChatRooms,
    getChatRoom,
    sendMessage,
    markAsRead,
    leaveRoom,
    searchRooms,
    pinChatRoom,
    deleteRoom,
    getRoomInfo,
    sendImageMessage,
    updateRoomSettings,
    updateRoomName,
    updateParticipants,
    toggleImportant,
    getRoomDetail
};