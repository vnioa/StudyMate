const db = require('../config/db');

// 친구 목록 조회
const getFriends = async (req, res) => {
    const { group, search } = req.query;
    try {
        let query = 'SELECT u.* FROM users u JOIN friends f ON u.user_id = f.friend_id WHERE f.user_id = ?';
        const params = [req.user.id];

        if (group) {
            query += ' AND f.group_name = ?';
            params.push(group);
        }
        if (search) {
            query += ' AND (u.username LIKE ? OR u.name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        const [friends] = await db.execute(query, params);
        res.status(200).json({ friends });
    } catch (error) {
        console.error('친구 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '친구 목록을 불러오는데 실패했습니다.'
        });
    }
};

// 친구 검색
const searchFriends = async (req, res) => {
    const { query } = req.query;
    try {
        const [friends] = await db.execute(
            'SELECT * FROM users WHERE username LIKE ? OR name LIKE ?',
            [`%${query}%`, `%${query}%`]
        );
        res.status(200).json({ friends });
    } catch (error) {
        console.error('친구 검색 오류:', error);
        res.status(500).json({
            success: false,
            message: '친구 검색에 실패했습니다.'
        });
    }
};

// 친구 그룹 목록 조회
const getGroups = async (req, res) => {
    try {
        const [groups] = await db.execute(
            'SELECT DISTINCT group_name FROM friends WHERE user_id = ?',
            [req.user.id]
        );
        res.status(200).json({ groups: groups.map(g => g.group_name) });
    } catch (error) {
        console.error('친구 그룹 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '친구 그룹 목록을 불러오는데 실패했습니다.'
        });
    }
};

// 친구 추가
const addFriend = async (req, res) => {
    const { friendId } = req.body;
    try {
        await db.execute(
            'INSERT INTO friends (user_id, friend_id) VALUES (?, ?)',
            [req.user.id, friendId]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('친구 추가 오류:', error);
        res.status(500).json({
            success: false,
            message: '친구 추가에 실패했습니다.'
        });
    }
};

// 친구 삭제
const removeFriend = async (req, res) => {
    const { friendId } = req.params;
    try {
        await db.execute(
            'DELETE FROM friends WHERE user_id = ? AND friend_id = ?',
            [req.user.id, friendId]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('친구 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '친구 삭제에 실패했습니다.'
        });
    }
};

// 친구 그룹 변경
const updateFriendGroup = async (req, res) => {
    const { friendId } = req.params;
    const { group } = req.body;
    try {
        await db.execute(
            'UPDATE friends SET group_name = ? WHERE user_id = ? AND friend_id = ?',
            [group, req.user.id, friendId]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('친구 그룹 변경 오류:', error);
        res.status(500).json({
            success: false,
            message: '친구 그룹 변경에 실패했습니다.'
        });
    }
};

// 친구 요청 목록 조회
const getFriendRequests = async (req, res) => {
    try {
        const [requests] = await db.execute(
            'SELECT * FROM friend_requests WHERE recipient_id = ? AND status = "pending"',
            [req.user.id]
        );
        res.status(200).json({ requests });
    } catch (error) {
        console.error('친구 요청 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '친구 요청 목록을 불러오는데 실패했습니다.'
        });
    }
};

// 친구 요청 보내기
const sendFriendRequest = async (req, res) => {
    const { userId } = req.body;
    try {
        await db.execute(
            'INSERT INTO friend_requests (sender_id, recipient_id, status) VALUES (?, ?, "pending")',
            [req.user.id, userId]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('친구 요청 전송 오류:', error);
        res.status(500).json({
            success: false,
            message: '친구 요청 전송에 실패했습니다.'
        });
    }
};

// 친구 요청 수락
const acceptFriendRequest = async (req, res) => {
    const { requestId } = req.params;
    try {
        await db.execute(
            'UPDATE friend_requests SET status = "accepted" WHERE request_id = ?',
            [requestId]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('친구 요청 수락 오류:', error);
        res.status(500).json({
            success: false,
            message: '친구 요청 수락에 실패했습니다.'
        });
    }
};

// 친구 요청 거절
const rejectFriendRequest = async (req, res) => {
    const { requestId } = req.params;
    try {
        await db.execute(
            'UPDATE friend_requests SET status = "rejected" WHERE request_id = ?',
            [requestId]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('친구 요청 거절 오류:', error);
        res.status(500).json({
            success: false,
            message: '친구 요청 거절에 실패했습니다.'
        });
    }
};

// 친구 프로필 조회
const getFriendProfile = async (req, res) => {
    const { friendId } = req.params;
    try {
        const [friend] = await db.execute(
            'SELECT u.*, f.is_blocked, f.is_hidden FROM users u LEFT JOIN friends f ON u.user_id = f.friend_id WHERE u.user_id = ? AND f.user_id = ?',
            [friendId, req.user.id]
        );

        const [commonGroups] = await db.execute(
            'SELECT * FROM study_groups WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = ? AND group_id IN (SELECT group_id FROM group_members WHERE user_id = ?))',
            [req.user.id, friendId]
        );

        res.status(200).json({
            friend: friend[0],
            isBlocked: friend[0]?.is_blocked || false,
            isHidden: friend[0]?.is_hidden || false,
            commonGroups
        });
    } catch (error) {
        console.error('친구 프로필 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '친구 프로필을 불러오는데 실패했습니다.'
        });
    }
};

// 친구 차단/해제
const toggleBlock = async (req, res) => {
    const { friendId } = req.params;
    try {
        const [current] = await db.execute(
            'SELECT is_blocked FROM friends WHERE user_id = ? AND friend_id = ?',
            [req.user.id, friendId]
        );

        const newBlockStatus = !(current[0]?.is_blocked);
        await db.execute(
            'UPDATE friends SET is_blocked = ? WHERE user_id = ? AND friend_id = ?',
            [newBlockStatus, req.user.id, friendId]
        );

        res.status(200).json({ isBlocked: newBlockStatus });
    } catch (error) {
        console.error('친구 차단 상태 변경 오류:', error);
        res.status(500).json({
            success: false,
            message: '친구 차단 상태 변경에 실패했습니다.'
        });
    }
};

// 친구 숨김/해제
const toggleHide = async (req, res) => {
    const { friendId } = req.params;
    try {
        const [current] = await db.execute(
            'SELECT is_hidden FROM friends WHERE user_id = ? AND friend_id = ?',
            [req.user.id, friendId]
        );

        const newHideStatus = !(current[0]?.is_hidden);
        await db.execute(
            'UPDATE friends SET is_hidden = ? WHERE user_id = ? AND friend_id = ?',
            [newHideStatus, req.user.id, friendId]
        );

        res.status(200).json({ isHidden: newHideStatus });
    } catch (error) {
        console.error('친구 숨김 상태 변경 오류:', error);
        res.status(500).json({
            success: false,
            message: '친구 숨김 상태 변경에 실패했습니다.'
        });
    }
};

// 채팅방 시작
const startChat = async (req, res) => {
    const { friendId } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO chat_rooms (type) VALUES ("individual")'
        );

        await db.execute(
            'INSERT INTO chat_room_participants (room_id, user_id) VALUES (?, ?), (?, ?)',
            [result.insertId, req.user.id, result.insertId, friendId]
        );

        res.status(200).json({ roomId: result.insertId });
    } catch (error) {
        console.error('채팅방 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '채팅방 생성에 실패했습니다.'
        });
    }
};

module.exports = {
    getFriends,
    searchFriends,
    getGroups,
    addFriend,
    removeFriend,
    updateFriendGroup,
    getFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    sendFriendRequest,
    getFriendProfile,
    toggleBlock,
    toggleHide,
    startChat
};