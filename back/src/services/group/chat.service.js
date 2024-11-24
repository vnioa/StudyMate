const db = require('../config/mysql');
const { messaging } = require('../config/firebase');

class ChatService {
    // 채팅 메시지 저장
    async saveMessage(groupId, userId, message, type = 'text') {
        try {
            const [result] = await db.execute(
                'INSERT INTO group_chat_messages (group_id, user_id, message, type) VALUES (?, ?, ?, ?)',
                [groupId, userId, message, type]
            );

            // 그룹 멤버들에게 푸시 알림 전송
            const [members] = await db.execute(
                'SELECT user_id, fcm_token FROM group_members WHERE group_id = ? AND user_id != ?',
                [groupId, userId]
            );

            const [sender] = await db.execute(
                'SELECT name FROM users WHERE id = ?',
                [userId]
            );

            // FCM 토큰이 있는 멤버들에게 알림 전송
            for (const member of members) {
                if (member.fcm_token) {
                    await messaging.send({
                        token: member.fcm_token,
                        notification: {
                            title: '새로운 메시지',
                            body: `${sender[0].name}: ${message}`
                        },
                        data: {
                            groupId,
                            messageId: result.insertId.toString()
                        }
                    });
                }
            }

            return result.insertId;
        } catch (error) {
            console.error('메시지 저장 오류:', error);
            throw new Error('메시지 저장에 실패했습니다.');
        }
    }

    // 채팅 메시지 조회
    async getMessages(groupId, page = 1, limit = 50) {
        try {
            const offset = (page - 1) * limit;

            const [messages] = await db.execute(
                `SELECT m.*, u.name, u.profile_image
                 FROM group_chat_messages m
                          JOIN users u ON m.user_id = u.id
                 WHERE m.group_id = ?
                 ORDER BY m.created_at DESC
                     LIMIT ? OFFSET ?`,
                [groupId, limit, offset]
            );

            return messages.reverse();
        } catch (error) {
            console.error('메시지 조회 오류:', error);
            throw new Error('메시지 조회에 실패했습니다.');
        }
    }

    // 채팅방 참여자 목록 조회
    async getChatParticipants(groupId) {
        try {
            const [participants] = await db.execute(
                `SELECT u.id, u.name, u.profile_image, u.last_active
                 FROM users u
                          JOIN group_members gm ON u.id = gm.user_id
                 WHERE gm.group_id = ?`,
                [groupId]
            );

            return participants;
        } catch (error) {
            console.error('참여자 목록 조회 오류:', error);
            throw new Error('참여자 목록 조회에 실패했습니다.');
        }
    }

    // 메시지 삭제
    async deleteMessage(messageId, userId) {
        try {
            const [message] = await db.execute(
                'SELECT * FROM group_chat_messages WHERE id = ? AND user_id = ?',
                [messageId, userId]
            );

            if (message.length === 0) {
                throw new Error('메시지를 삭제할 권한이 없습니다.');
            }

            await db.execute(
                'DELETE FROM group_chat_messages WHERE id = ?',
                [messageId]
            );

            return true;
        } catch (error) {
            console.error('메시지 삭제 오류:', error);
            throw new Error('메시지 삭제에 실패했습니다.');
        }
    }
}

module.exports = new ChatService();