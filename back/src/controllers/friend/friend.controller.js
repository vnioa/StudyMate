const db = require('../../config/mysql');

class FriendController {
    // 친구 요청 보내기
    async sendFriendRequest(req, res) {
        try {
            const { toUserId } = req.body;
            const fromUserId = req.user.id;

            // 이미 친구인지 확인
            const [existing] = await db.execute(
                'SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
                [fromUserId, toUserId, toUserId, fromUserId]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '이미 친구 관계입니다.'
                });
            }

            // 친구 요청 전송
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

    // 친구 요청 수락/거절
    async respondToFriendRequest(req, res) {
        try {
            const { requestId, accept } = req.body;
            const userId = req.user.id;

            const [request] = await db.execute(
                'SELECT * FROM friend_requests WHERE id = ? AND to_user_id = ?',
                [requestId, userId]
            );

            if (request.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '친구 요청을 찾을 수 없습니다.'
                });
            }

            if (accept) {
                // 친구 관계 생성
                await db.execute(
                    'INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)',
                    [userId, request[0].from_user_id, request[0].from_user_id, userId]
                );
            }

            // 요청 삭제
            await db.execute('DELETE FROM friend_requests WHERE id = ?', [requestId]);

            res.status(200).json({
                success: true,
                message: accept ? '친구 요청을 수락했습니다.' : '친구 요청을 거절했습니다.'
            });
        } catch (error) {
            console.error('친구 요청 응답 오류:', error);
            res.status(500).json({
                success: false,
                message: '친구 요청 처리에 실패했습니다.'
            });
        }
    }

    // 친구 목록 조회
    async getFriends(req, res) {
        try {
            const userId = req.user.id;

            const [friends] = await db.execute(
                `SELECT u.id, u.username, u.name, u.profile_image 
         FROM friends f 
         JOIN users u ON f.friend_id = u.id 
         WHERE f.user_id = ?`,
                [userId]
            );

            res.status(200).json({
                success: true,
                friends
            });
        } catch (error) {
            console.error('친구 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '친구 목록 조회에 실패했습니다.'
            });
        }
    }

    // 친구 삭제
    async deleteFriend(req, res) {
        try {
            const { friendId } = req.params;
            const userId = req.user.id;

            await db.execute(
                'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
                [userId, friendId, friendId, userId]
            );

            res.status(200).json({
                success: true,
                message: '친구가 삭제되었습니다.'
            });
        } catch (error) {
            console.error('친구 삭제 오류:', error);
            res.status(500).json({
                success: false,
                message: '친구 삭제에 실패했습니다.'
            });
        }
    }
}

module.exports = new FriendController();