const db = require('../../config/mysql');
const { messaging } = require('../../config/firebase');

class ChatController {
    // 채팅 메시지 전송
    async sendMessage(req, res) {
        try {
            const { groupId, userId, message, type = 'text' } = req.body;

            const [result] = await db.execute(
                'INSERT INTO chat_messages (group_id, user_id, message, type) VALUES (?, ?, ?, ?)',
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

            for (const member of members) {
                if (member.fcm_token) {
                    await messaging.send({
                        token: member.fcm_token,
                        notification: {
                            title: '새로운 메시지',
                            body: `${sender[0].name}: ${message}`
                        }
                    });
                }
            }

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

    // 채팅 메시지 조회
    async getMessages(req, res) {
        try {
            const { groupId, page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;

            const [messages] = await db.execute(
                `SELECT m.*, u.name, u.profile_image
                 FROM chat_messages m
                          JOIN users u ON m.user_id = u.id
                 WHERE m.group_id = ?
                 ORDER BY m.created_at DESC
                     LIMIT ? OFFSET ?`,
                [groupId, parseInt(limit), offset]
            );

            res.status(200).json({
                success: true,
                messages: messages.reverse()
            });
        } catch (error) {
            console.error('메시지 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '메시지 조회에 실패했습니다.'
            });
        }
    }

    // 채팅방 참여자 목록 조회
    async getChatParticipants(req, res) {
        try {
            const { groupId } = req.params;

            const [participants] = await db.execute(
                `SELECT u.id, u.name, u.profile_image, u.last_active
                 FROM users u
                          JOIN group_members gm ON u.id = gm.user_id
                 WHERE gm.group_id = ?`,
                [groupId]
            );

            res.status(200).json({
                success: true,
                participants
            });
        } catch (error) {
            console.error('참여자 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '참여자 목록 조회에 실패했습니다.'
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

            await db.execute(
                'DELETE FROM chat_messages WHERE id = ?',
                [messageId]
            );

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
}

module.exports = new ChatController();