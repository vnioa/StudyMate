const db = require('../config/mysql');
const createError = require('http-errors');

const FriendsController = {
    // 친구 목록 조회
    getFriends: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { group, search } = req.query;
            let query = `
        SELECT u.*, f.group_name, f.created_at as friend_since
        FROM friends f
        JOIN users u ON f.friend_id = u.id
        WHERE f.user_id = ?
      `;
            const params = [req.user.id];

            if (group) {
                query += ' AND f.group_name = ?';
                params.push(group);
            }

            if (search) {
                query += ' AND (u.name LIKE ? OR u.user_id LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            const [friends] = await connection.query(query, params);
            res.json({ friends });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 친구 검색
    searchFriends: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { query } = req.query;
            const [friends] = await connection.query(
                `SELECT u.* FROM users u
         WHERE u.id != ? AND (u.name LIKE ? OR u.user_id LIKE ?)
         AND u.id NOT IN (SELECT friend_id FROM friends WHERE user_id = ?)`,
                [req.user.id, `%${query}%`, `%${query}%`, req.user.id]
            );
            res.json({ friends });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 친구 그룹 목록 조회
    getGroups: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [groups] = await connection.query(
                'SELECT DISTINCT group_name FROM friends WHERE user_id = ? AND group_name IS NOT NULL',
                [req.user.id]
            );
            res.json({ groups: groups.map(g => g.group_name) });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 친구 추가
    addFriend: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { friendId } = req.body;
            await connection.beginTransaction();

            const [existing] = await connection.query(
                'SELECT id FROM friends WHERE user_id = ? AND friend_id = ?',
                [req.user.id, friendId]
            );

            if (existing.length) {
                throw createError(400, '이미 친구로 등록된 사용자입니다.');
            }

            await connection.query(
                'INSERT INTO friends (user_id, friend_id) VALUES (?, ?)',
                [req.user.id, friendId]
            );

            await connection.commit();
            res.json({ success: true });
        } catch (err) {
            await connection.rollback();
            next(err);
        } finally {
            connection.release();
        }
    },

    // 친구 삭제
    removeFriend: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { friendId } = req.params;
            await connection.query(
                'DELETE FROM friends WHERE user_id = ? AND friend_id = ?',
                [req.user.id, friendId]
            );
            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 친구 그룹 변경
    updateFriendGroup: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { friendId } = req.params;
            const { group } = req.body;
            await connection.query(
                'UPDATE friends SET group_name = ? WHERE user_id = ? AND friend_id = ?',
                [group, req.user.id, friendId]
            );
            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 친구 요청 목록 조회
    getFriendRequests: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [requests] = await connection.query(
                `SELECT fr.*, u.name, u.user_id, u.profile_image 
         FROM friend_requests fr
         JOIN users u ON fr.sender_id = u.id
         WHERE fr.receiver_id = ? AND fr.status = 'pending'`,
                [req.user.id]
            );
            res.json({ requests });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 친구 요청 수락
    acceptFriendRequest: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { requestId } = req.params;
            await connection.beginTransaction();

            const [request] = await connection.query(
                'SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = "pending"',
                [requestId, req.user.id]
            );

            if (!request.length) {
                throw createError(404, '친구 요청을 찾을 수 없습니다.');
            }

            await connection.query(
                'INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)',
                [req.user.id, request[0].sender_id, request[0].sender_id, req.user.id]
            );

            await connection.query(
                'UPDATE friend_requests SET status = "accepted" WHERE id = ?',
                [requestId]
            );

            await connection.commit();
            res.json({ success: true });
        } catch (err) {
            await connection.rollback();
            next(err);
        } finally {
            connection.release();
        }
    },

    // 친구 요청 거절
    rejectFriendRequest: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { requestId } = req.params;
            await connection.query(
                'UPDATE friend_requests SET status = "rejected" WHERE id = ? AND receiver_id = ?',
                [requestId, req.user.id]
            );
            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 친구 요청 보내기
    sendFriendRequest: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { userId } = req.body;
            await connection.beginTransaction();

            const [existing] = await connection.query(
                'SELECT id FROM friend_requests WHERE sender_id = ? AND receiver_id = ? AND status = "pending"',
                [req.user.id, userId]
            );

            if (existing.length) {
                throw createError(400, '이미 친구 요청을 보냈습니다.');
            }

            await connection.query(
                'INSERT INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)',
                [req.user.id, userId]
            );

            await connection.commit();
            res.json({ success: true });
        } catch (err) {
            await connection.rollback();
            next(err);
        } finally {
            connection.release();
        }
    },

    // 친구 설정 조회/업데이트
    getFriendSettings: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [settings] = await connection.query(
                'SELECT * FROM friend_settings WHERE user_id = ?',
                [req.user.id]
            );
            res.json({ settings: settings[0] || {} });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    updateFriendSettings: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { allowFriendRequests, showOnlineStatus } = req.body;
            await connection.query(
                `INSERT INTO friend_settings (user_id, allow_friend_requests, show_online_status)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
         allow_friend_requests = VALUES(allow_friend_requests),
         show_online_status = VALUES(show_online_status)`,
                [req.user.id, allowFriendRequests, showOnlineStatus]
            );
            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 친구 프로필 조회
    getFriendProfile: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { friendId } = req.params;
            const [[friend], [blocked], [hidden], [groups]] = await Promise.all([
                connection.query(
                    'SELECT u.*, f.group_name FROM users u LEFT JOIN friends f ON f.friend_id = u.id WHERE u.id = ?',
                    [friendId]
                ),
                connection.query(
                    'SELECT COUNT(*) as blocked FROM blocked_friends WHERE user_id = ? AND blocked_id = ?',
                    [req.user.id, friendId]
                ),
                connection.query(
                    'SELECT COUNT(*) as hidden FROM hidden_friends WHERE user_id = ? AND hidden_id = ?',
                    [req.user.id, friendId]
                ),
                connection.query(
                    `SELECT g.* FROM group_members gm1
           JOIN group_members gm2 ON gm1.group_id = gm2.group_id
           JOIN groups g ON g.id = gm1.group_id
           WHERE gm1.user_id = ? AND gm2.user_id = ?`,
                    [req.user.id, friendId]
                )
            ]);

            res.json({
                friend,
                isBlocked: blocked[0].blocked > 0,
                isHidden: hidden[0].hidden > 0,
                commonGroups: groups
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    }
};

module.exports = FriendsController;