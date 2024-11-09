// controllers/friendController.js
const db = require('../config/db');

exports.getFriendList = async (req, res) => {
    const userId = req.user.id;
    try {
        const [friends] = await db.execute(`
            SELECT u.id, u.username, u.profile_image, u.status_message
            FROM users u
                     JOIN friendships f ON (u.id = f.user_id1 OR u.id = f.user_id2)
            WHERE (f.user_id1 = ? OR f.user_id2 = ?) AND u.id != ? AND f.status = 'accepted'
        `, [userId, userId, userId]);

        res.status(200).json({ success: true, friends });
    } catch (error) {
        console.error('친구 목록 조회 오류:', error);
        res.status(500).json({ success: false, message: '친구 목록 조회에 실패했습니다.' });
    }
};

exports.sendFriendRequest = async (req, res) => {
    const { friendId } = req.body;
    const userId = req.user.id;

    if (userId === friendId) {
        return res.status(400).json({ success: false, message: '자기 자신에게 친구 요청을 보낼 수 없습니다.' });
    }

    try {
        const [existingFriendship] = await db.execute(
            'SELECT * FROM friendships WHERE (user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)',
            [userId, friendId, friendId, userId]
        );

        if (existingFriendship.length > 0) {
            return res.status(400).json({ success: false, message: '이미 친구이거나 친구 요청이 진행 중입니다.' });
        }

        await db.execute(
            'INSERT INTO friendships (user_id1, user_id2, status) VALUES (?, ?, "pending")',
            [userId, friendId]
        );

        res.status(201).json({ success: true, message: '친구 요청을 보냈습니다.' });
    } catch (error) {
        console.error('친구 요청 오류:', error);
        res.status(500).json({ success: false, message: '친구 요청에 실패했습니다.' });
    }
};

exports.acceptFriendRequest = async (req, res) => {
    const { requestId } = req.params;
    const userId = req.user.id;

    try {
        const [friendship] = await db.execute(
            'SELECT * FROM friendships WHERE id = ? AND user_id2 = ? AND status = "pending"',
            [requestId, userId]
        );

        if (friendship.length === 0) {
            return res.status(404).json({ success: false, message: '유효하지 않은 친구 요청입니다.' });
        }

        await db.execute(
            'UPDATE friendships SET status = "accepted" WHERE id = ?',
            [requestId]
        );

        res.status(200).json({ success: true, message: '친구 요청을 수락했습니다.' });
    } catch (error) {
        console.error('친구 요청 수락 오류:', error);
        res.status(500).json({ success: false, message: '친구 요청 수락에 실패했습니다.' });
    }
};

exports.rejectFriendRequest = async (req, res) => {
    const { requestId } = req.params;
    const userId = req.user.id;

    try {
        const [friendship] = await db.execute(
            'SELECT * FROM friendships WHERE id = ? AND user_id2 = ? AND status = "pending"',
            [requestId, userId]
        );

        if (friendship.length === 0) {
            return res.status(404).json({ success: false, message: '유효하지 않은 친구 요청입니다.' });
        }

        await db.execute('DELETE FROM friendships WHERE id = ?', [requestId]);

        res.status(200).json({ success: true, message: '친구 요청을 거절했습니다.' });
    } catch (error) {
        console.error('친구 요청 거절 오류:', error);
        res.status(500).json({ success: false, message: '친구 요청 거절에 실패했습니다.' });
    }
};

exports.removeFriend = async (req, res) => {
    const { friendId } = req.params;
    const userId = req.user.id;

    try {
        await db.execute(
            'DELETE FROM friendships WHERE (user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)',
            [userId, friendId, friendId, userId]
        );

        res.status(200).json({ success: true, message: '친구가 삭제되었습니다.' });
    } catch (error) {
        console.error('친구 삭제 오류:', error);
        res.status(500).json({ success: false, message: '친구 삭제에 실패했습니다.' });
    }
};

exports.blockUser = async (req, res) => {
    const { userId } = req.params;
    const blockerId = req.user.id;

    try {
        await db.execute(
            'INSERT INTO user_blocks (blocker_id, blocked_id) VALUES (?, ?)',
            [blockerId, userId]
        );

        // 기존 친구 관계 삭제
        await db.execute(
            'DELETE FROM friendships WHERE (user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)',
            [blockerId, userId, userId, blockerId]
        );

        res.status(200).json({ success: true, message: '사용자를 차단했습니다.' });
    } catch (error) {
        console.error('사용자 차단 오류:', error);
        res.status(500).json({ success: false, message: '사용자 차단에 실패했습니다.' });
    }
};

exports.unblockUser = async (req, res) => {
    const { userId } = req.params;
    const blockerId = req.user.id;

    try {
        await db.execute(
            'DELETE FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?',
            [blockerId, userId]
        );

        res.status(200).json({ success: true, message: '사용자 차단을 해제했습니다.' });
    } catch (error) {
        console.error('사용자 차단 해제 오류:', error);
        res.status(500).json({ success: false, message: '사용자 차단 해제에 실패했습니다.' });
    }
};

exports.getBlockedUsers = async (req, res) => {
    const userId = req.user.id;

    try {
        const [blockedUsers] = await db.execute(`
      SELECT u.id, u.username, u.profile_image
      FROM users u
      JOIN user_blocks ub ON u.id = ub.blocked_id
      WHERE ub.blocker_id = ?
    `, [userId]);

        res.status(200).json({ success: true, blockedUsers });
    } catch (error) {
        console.error('차단된 사용자 목록 조회 오류:', error);
        res.status(500).json({ success: false, message: '차단된 사용자 목록 조회에 실패했습니다.' });
    }
};