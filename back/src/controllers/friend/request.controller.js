const db = require('../config/mysql');

class RequestController {
    // 친구 요청 보내기
    async sendRequest(req, res) {
        try {
            const { toUserId } = req.body;
            const fromUserId = req.user.id;

            // 이미 요청이 존재하는지 확인
            const [existingRequest] = await db.execute(
                'SELECT * FROM friend_requests WHERE from_user_id = ? AND to_user_id = ?',
                [fromUserId, toUserId]
            );

            if (existingRequest.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '이미 친구 요청을 보냈습니다.'
                });
            }

            await db.execute(
                'INSERT INTO friend_requests (from_user_id, to_user_id) VALUES (?, ?)',
                [fromUserId, toUserId]
            );

            res.status(201).json({
                success: true,
                message: '친구 요청을 보냈습니다.'
            });
        } catch (error) {
            console.error('친구 요청 오류:', error);
            res.status(500).json({
                success: false,
                message: '친구 요청에 실패했습니다.'
            });
        }
    }

    // 받은 친구 요청 목록 조회
    async getReceivedRequests(req, res) {
        try {
            const userId = req.user.id;

            const [requests] = await db.execute(
                `SELECT r.*, u.username, u.name, u.profile_image 
         FROM friend_requests r 
         JOIN users u ON r.from_user_id = u.id 
         WHERE r.to_user_id = ? 
         ORDER BY r.created_at DESC`,
                [userId]
            );

            res.status(200).json({
                success: true,
                requests
            });
        } catch (error) {
            console.error('요청 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '요청 목록 조회에 실패했습니다.'
            });
        }
    }

    // 보낸 친구 요청 목록 조회
    async getSentRequests(req, res) {
        try {
            const userId = req.user.id;

            const [requests] = await db.execute(
                `SELECT r.*, u.username, u.name, u.profile_image 
         FROM friend_requests r 
         JOIN users u ON r.to_user_id = u.id 
         WHERE r.from_user_id = ? 
         ORDER BY r.created_at DESC`,
                [userId]
            );

            res.status(200).json({
                success: true,
                requests
            });
        } catch (error) {
            console.error('보낸 요청 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '보낸 요청 목록 조회에 실패했습니다.'
            });
        }
    }

    // 친구 요청 취소/거절
    async cancelRequest(req, res) {
        try {
            const { requestId } = req.params;
            const userId = req.user.id;

            await db.execute(
                'DELETE FROM friend_requests WHERE id = ? AND (from_user_id = ? OR to_user_id = ?)',
                [requestId, userId, userId]
            );

            res.status(200).json({
                success: true,
                message: '친구 요청이 취소되었습니다.'
            });
        } catch (error) {
            console.error('요청 취소 오류:', error);
            res.status(500).json({
                success: false,
                message: '요청 취소에 실패했습니다.'
            });
        }
    }
}

module.exports = new RequestController();