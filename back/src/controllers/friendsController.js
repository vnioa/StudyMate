const db = require('../config/db');

// 유틸리티 함수
const utils = {
    async executeQuery(query, params) {
        try {
            const [results] = await db.execute(query, params);
            return results;
        } catch (error) {
            console.error('Query execution error:', error);
            throw new Error('데이터베이스 쿼리 실행 실패');
        }
    },

    async executeTransaction(callback) {
        let connection;
        try {
            connection = await db.getConnection();
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }
};

const friendsController = {
    // 친구 목록 조회
    getFriends: async (req, res) => {
        try {
            const userId = req.user.id;
            const { group } = req.query;

            let query = `
        SELECT f.*, a.username, a.name, a.profileImage, a.lastLogin, 
               fs.showOnlineStatus
        FROM friends f
        JOIN auth a ON f.friendId = a.id
        LEFT JOIN friend_settings fs ON f.memberId = fs.memberId
        WHERE f.memberId = ? AND f.isHidden = false
      `;
            const params = [userId];

            if (group) {
                query += ' AND f.group = ?';
                params.push(group);
            }

            const friends = await utils.executeQuery(query, params);

            res.status(200).json({
                success: true,
                message: '친구 목록을 성공적으로 조회했습니다.',
                data: friends
            });
        } catch (error) {
            console.error('친구 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '친구 목록 조회에 실패했습니다.'
            });
        }
    },

    // 친구 검색
    searchFriends: async (req, res) => {
        try {
            const userId = req.user.id;
            const { query } = req.query;

            const friends = await utils.executeQuery(`
        SELECT f.*, a.username, a.name, a.profileImage
        FROM friends f
        JOIN auth a ON f.friendId = a.id
        WHERE f.memberId = ? 
        AND f.isHidden = false
        AND (a.username LIKE ? OR a.name LIKE ?)
      `, [userId, `%${query}%`, `%${query}%`]);

            res.status(200).json({
                success: true,
                data: friends
            });
        } catch (error) {
            console.error('친구 검색 오류:', error);
            res.status(500).json({
                success: false,
                message: '친구 검색에 실패했습니다.'
            });
        }
    },

    // 친구 그룹 목록 조회
    getGroups: async (req, res) => {
        try {
            const userId = req.user.id;

            const groups = await utils.executeQuery(`
        SELECT fg.*, COUNT(f.id) as friendCount
        FROM friend_groups fg
        LEFT JOIN friends f ON fg.name = f.group AND f.memberId = fg.memberId
        WHERE fg.memberId = ?
        GROUP BY fg.id
        ORDER BY fg.order ASC
      `, [userId]);

            res.status(200).json({
                success: true,
                data: groups
            });
        } catch (error) {
            console.error('친구 그룹 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '친구 그룹 목록 조회에 실패했습니다.'
            });
        }
    },

    // 친구 추가
    addFriend: async (req, res) => {
        try {
            const userId = req.user.id;
            const { friendId } = req.body;

            const result = await utils.executeTransaction(async (connection) => {
                const [existingFriend] = await connection.execute(
                    'SELECT id FROM friends WHERE memberId = ? AND friendId = ?',
                    [userId, friendId]
                );

                if (existingFriend) {
                    throw new Error('이미 친구로 등록된 사용자입니다.');
                }

                await connection.execute(`
          INSERT INTO friends (memberId, friendId, createdAt)
          VALUES (?, ?, NOW()), (?, ?, NOW())
        `, [userId, friendId, friendId, userId]);

                const [friend] = await connection.execute(`
          SELECT f.*, a.username, a.name
          FROM friends f
          JOIN auth a ON f.friendId = a.id
          WHERE f.memberId = ? AND f.friendId = ?
        `, [userId, friendId]);

                return friend;
            });

            res.status(201).json({
                success: true,
                message: '친구가 추가되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('친구 추가 오류:', error);
            res.status(500).json({
                success: false,
                message: '친구 추가에 실패했습니다.'
            });
        }
    },

    // 친구 삭제
    removeFriend: async (req, res) => {
        try {
            const userId = req.user.id;
            const { friendId } = req.params;

            await utils.executeTransaction(async (connection) => {
                await connection.execute(`
          DELETE FROM friends 
          WHERE (memberId = ? AND friendId = ?) 
          OR (memberId = ? AND friendId = ?)
        `, [userId, friendId, friendId, userId]);
            });

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
    },

    // 친구 요청 목록 조회
    getFriendRequests: async (req, res) => {
        try {
            const userId = req.user.id;

            const requests = await utils.executeQuery(`
        SELECT fr.*, a.username, a.name, a.profileImage
        FROM friend_requests fr
        JOIN auth a ON fr.memberId = a.id
        WHERE fr.friendId = ? AND fr.status = 'pending'
        ORDER BY fr.createdAt DESC
      `, [userId]);

            res.status(200).json({
                success: true,
                data: requests
            });
        } catch (error) {
            console.error('친구 요청 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '친구 요청 목록 조회에 실패했습니다.'
            });
        }
    },

    // 친구 요청 수락
    acceptFriendRequest: async (req, res) => {
        try {
            const userId = req.user.id;
            const { requestId } = req.params;

            await utils.executeTransaction(async (connection) => {
                const [request] = await connection.execute(
                    'SELECT * FROM friend_requests WHERE id = ? AND friendId = ? AND status = "pending"',
                    [requestId, userId]
                );

                if (!request) {
                    throw new Error('유효하지 않은 친구 요청입니다.');
                }

                await connection.execute(
                    'UPDATE friend_requests SET status = "accepted" WHERE id = ?',
                    [requestId]
                );

                await connection.execute(`
          INSERT INTO friends (memberId, friendId, createdAt)
          VALUES (?, ?, NOW()), (?, ?, NOW())
        `, [userId, request[0].memberId, request[0].memberId, userId]);
            });

            res.status(200).json({
                success: true,
                message: '친구 요청이 수락되었습니다.'
            });
        } catch (error) {
            console.error('친구 요청 수락 오류:', error);
            res.status(500).json({
                success: false,
                message: '친구 요청 수락에 실패했습니다.'
            });
        }
    },

    // 친구 요청 거절
    rejectFriendRequest: async (req, res) => {
        try {
            const userId = req.user.id;
            const { requestId } = req.params;

            const result = await utils.executeQuery(`
        UPDATE friend_requests
        SET status = 'rejected'
        WHERE id = ? AND friendId = ? AND status = 'pending'
      `, [requestId, userId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '유효하지 않은 친구 요청입니다.'
                });
            }

            res.status(200).json({
                success: true,
                message: '친구 요청이 거절되었습니다.'
            });
        } catch (error) {
            console.error('친구 요청 거절 오류:', error);
            res.status(500).json({
                success: false,
                message: '친구 요청 거절에 실패했습니다.'
            });
        }
    },

    // 친구 요청 보내기
    sendFriendRequest: async (req, res) => {
        try {
            const userId = req.user.id;
            const { userId: targetId, message } = req.body;

            const result = await utils.executeTransaction(async (connection) => {
                const [existingFriend] = await connection.execute(
                    'SELECT id FROM friends WHERE memberId = ? AND friendId = ?',
                    [userId, targetId]
                );

                if (existingFriend) {
                    throw new Error('이미 친구로 등록된 사용자입니다.');
                }

                const [existingRequest] = await connection.execute(`
          SELECT id FROM friend_requests 
          WHERE memberId = ? AND friendId = ? AND status = 'pending'
        `, [userId, targetId]);

                if (existingRequest) {
                    throw new Error('이미 친구 요청을 보냈습니다.');
                }

                const [result] = await connection.execute(`
          INSERT INTO friend_requests (memberId, friendId, message, status, createdAt)
          VALUES (?, ?, ?, 'pending', NOW())
        `, [userId, targetId, message]);

                return { id: result.insertId, message };
            });

            res.status(201).json({
                success: true,
                message: '친구 요청을 보냈습니다.',
                data: result
            });
        } catch (error) {
            console.error('친구 요청 보내기 오류:', error);
            res.status(500).json({
                success: false,
                message: '친구 요청 보내기에 실패했습니다.'
            });
        }
    },

    // 공통 그룹 조회
    getCommonGroups: async (req, res) => {
        try {
            const userId = req.user.id;
            const { friendId } = req.params;

            const groups = await utils.executeQuery(`
        SELECT DISTINCT sg.*
        FROM study_groups sg
        JOIN study_group_members sgm1 ON sg.id = sgm1.groupId
        JOIN study_group_members sgm2 ON sg.id = sgm2.groupId
        WHERE sgm1.memberId = ? AND sgm2.memberId = ? AND sg.status = 'active'
        ORDER BY sg.name
      `, [userId, friendId]);

            res.status(200).json({
                success: true,
                data: groups
            });
        } catch (error) {
            console.error('공통 그룹 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '공통 그룹 조회에 실패했습니다.'
            });
        }
    }
};

module.exports = friendsController;