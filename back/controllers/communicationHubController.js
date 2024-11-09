// controllers/communicationHubController.js
const db = require('../config/db');

exports.getCommunicationData = async (req, res) => {
    const userId = req.user.id;
    try {
        // 최근 채팅 목록 조회
        const [recentChats] = await db.execute(`
      SELECT c.id, c.name, c.last_message, c.last_message_time
      FROM chats c
      JOIN chat_participants cp ON c.id = cp.chat_id
      WHERE cp.user_id = ?
      ORDER BY c.last_message_time DESC
      LIMIT 5
    `, [userId]);

        // 최근 통화 기록 조회
        const [recentCalls] = await db.execute(`
      SELECT id, caller_id, receiver_id, call_type, start_time, duration
      FROM calls
      WHERE caller_id = ? OR receiver_id = ?
      ORDER BY start_time DESC
      LIMIT 5
    `, [userId, userId]);

        // 온라인 상태인 친구 목록 조회
        const [onlineFriends] = await db.execute(`
      SELECT u.id, u.username, u.profile_image
      FROM users u
      JOIN friendships f ON (u.id = f.user_id1 OR u.id = f.user_id2)
      WHERE (f.user_id1 = ? OR f.user_id2 = ?) AND u.id != ? AND u.online_status = 'online'
    `, [userId, userId, userId]);

        res.status(200).json({
            success: true,
            data: {
                recentChats,
                recentCalls,
                onlineFriends
            }
        });
    } catch (error) {
        console.error('통합 커뮤니케이션 데이터 조회 오류:', error);
        res.status(500).json({ success: false, message: '데이터 조회에 실패했습니다.' });
    }
};

exports.initiateCall = async (req, res) => {
    const { receiverId, callType } = req.body;
    const callerId = req.user.id;
    try {
        const [result] = await db.execute(
            'INSERT INTO calls (caller_id, receiver_id, call_type, start_time) VALUES (?, ?, ?, NOW())',
            [callerId, receiverId, callType]
        );
        res.status(201).json({ success: true, callId: result.insertId });
    } catch (error) {
        console.error('통화 시작 오류:', error);
        res.status(500).json({ success: false, message: '통화 시작에 실패했습니다.' });
    }
};