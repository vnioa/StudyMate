const db = require('../../config/mysql');
const { messaging } = require('../../config/firebase');

class CommunicationController {
    // 실시간 채팅 메시지 저장
    async saveMessage(req, res) {
        try {
            const { groupId, userId, message, type = 'text' } = req.body;

            const [result] = await db.execute(
                'INSERT INTO group_chat_messages (group_id, user_id, message, type) VALUES (?, ?, ?, ?)',
                [groupId, userId, message, type]
            );

            // 그룹 멤버들에게 푸시 알림 전송
            const [members] = await db.execute(
                'SELECT user_id FROM group_members WHERE group_id = ? AND user_id != ?',
                [groupId, userId]
            );

            const [sender] = await db.execute(
                'SELECT name FROM users WHERE id = ?',
                [userId]
            );

            for (const member of members) {
                await messaging.send({
                    token: member.fcm_token,
                    notification: {
                        title: `새로운 메시지`,
                        body: `${sender[0].name}: ${message}`
                    }
                });
            }

            res.status(201).json({
                success: true,
                messageId: result.insertId
            });
        } catch (error) {
            console.error('메시지 저장 오류:', error);
            res.status(500).json({
                success: false,
                message: '메시지 저장에 실패했습니다.'
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
         FROM group_chat_messages m 
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

    // 토론 게시글 작성
    async createDiscussion(req, res) {
        try {
            const { groupId, userId, title, content, tags } = req.body;

            const [result] = await db.execute(
                'INSERT INTO group_discussions (group_id, user_id, title, content, tags) VALUES (?, ?, ?, ?, ?)',
                [groupId, userId, title, content, JSON.stringify(tags)]
            );

            res.status(201).json({
                success: true,
                discussionId: result.insertId
            });
        } catch (error) {
            console.error('토론 게시글 작성 오류:', error);
            res.status(500).json({
                success: false,
                message: '토론 게시글 작성에 실패했습니다.'
            });
        }
    }

    // 투표 생성
    async createPoll(req, res) {
        try {
            const { groupId, userId, title, options, endDate } = req.body;

            const [result] = await db.execute(
                'INSERT INTO group_polls (group_id, user_id, title, options, end_date) VALUES (?, ?, ?, ?, ?)',
                [groupId, userId, title, JSON.stringify(options), endDate]
            );

            res.status(201).json({
                success: true,
                pollId: result.insertId
            });
        } catch (error) {
            console.error('투표 생성 오류:', error);
            res.status(500).json({
                success: false,
                message: '투표 생성에 실패했습니다.'
            });
        }
    }

    // 투표 참여
    async votePoll(req, res) {
        try {
            const { pollId, userId, optionId } = req.body;

            await db.execute(
                'INSERT INTO poll_votes (poll_id, user_id, option_id) VALUES (?, ?, ?)',
                [pollId, userId, optionId]
            );

            // 투표 결과 집계
            const [results] = await db.execute(
                `SELECT option_id, COUNT(*) as count 
         FROM poll_votes 
         WHERE poll_id = ? 
         GROUP BY option_id`,
                [pollId]
            );

            res.status(200).json({
                success: true,
                results
            });
        } catch (error) {
            console.error('투표 참여 오류:', error);
            res.status(500).json({
                success: false,
                message: '투표 참여에 실패했습니다.'
            });
        }
    }
}

module.exports = new CommunicationController();