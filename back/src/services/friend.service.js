const db = require('../config/mysql');

class FriendService {
    // 친구 요청 보내기
    async sendFriendRequest(fromUserId, toUserId) {
        try {
            // 이미 친구인지 확인
            const [existing] = await db.execute(
                'SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
                [fromUserId, toUserId, toUserId, fromUserId]
            );

            if (existing.length > 0) {
                throw new Error('이미 친구 관계가 존재합니다.');
            }

            await db.execute(
                'INSERT INTO friend_requests (from_user_id, to_user_id) VALUES (?, ?)',
                [fromUserId, toUserId]
            );

            return true;
        } catch (error) {
            console.error('친구 요청 오류:', error);
            throw error;
        }
    }

    // 친구 요청 수락
    async acceptFriendRequest(requestId, userId) {
        try {
            const [request] = await db.execute(
                'SELECT * FROM friend_requests WHERE id = ? AND to_user_id = ?',
                [requestId, userId]
            );

            if (request.length === 0) {
                throw new Error('친구 요청을 찾을 수 없습니다.');
            }

            // 양방향 친구 관계 생성
            await db.execute(
                'INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)',
                [userId, request[0].from_user_id, request[0].from_user_id, userId]
            );

            // 요청 삭제
            await db.execute('DELETE FROM friend_requests WHERE id = ?', [requestId]);

            return true;
        } catch (error) {
            console.error('친구 요청 수락 오류:', error);
            throw error;
        }
    }

    // 친구 목록 조회
    async getFriends(userId) {
        try {
            const [friends] = await db.execute(
                `SELECT u.id, u.username, u.name, u.profile_image
                 FROM friends f
                          JOIN users u ON f.friend_id = u.id
                 WHERE f.user_id = ?`,
                [userId]
            );

            return friends;
        } catch (error) {
            console.error('친구 목록 조회 오류:', error);
            throw error;
        }
    }

    // 친구 요청 목록 조회
    async getFriendRequests(userId) {
        try {
            const [requests] = await db.execute(
                `SELECT r.*, u.username, u.name, u.profile_image
                 FROM friend_requests r
                          JOIN users u ON r.from_user_id = u.id
                 WHERE r.to_user_id = ?`,
                [userId]
            );

            return requests;
        } catch (error) {
            console.error('친구 요청 목록 조회 오류:', error);
            throw error;
        }
    }

    // 친구 삭제
    async deleteFriend(userId, friendId) {
        try {
            await db.execute(
                'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
                [userId, friendId, friendId, userId]
            );

            return true;
        } catch (error) {
            console.error('친구 삭제 오류:', error);
            throw error;
        }
    }
}

module.exports = new FriendService();