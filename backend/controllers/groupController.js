const db = require('../config/db');

// 그룹 활동 내역 조회
const getGroupActivities = async (req, res) => {
    const { groupId } = req.params;
    try {
        const [activities] = await db.execute(
            'SELECT * FROM group_activities WHERE group_id = ? ORDER BY created_at DESC',
            [groupId]
        );
        res.status(200).json({ activities });
    } catch (error) {
        console.error('그룹 활동 내역 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '그룹 활동 내역을 불러오는데 실패했습니다.'
        });
    }
};

// 멤버 활동 내역 조회
const getMemberActivities = async (req, res) => {
    const { groupId } = req.params;
    try {
        const [activities] = await db.execute(
            'SELECT * FROM member_activities WHERE group_id = ? ORDER BY created_at DESC',
            [groupId]
        );
        res.status(200).json({ activities });
    } catch (error) {
        console.error('멤버 활동 내역 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '멤버 활동 내역을 불러오는데 실패했습니다.'
        });
    }
};

// 그룹 상세 정보 조회
const getGroupDetail = async (req, res) => {
    const { groupId } = req.params;
    try {
        const [group] = await db.execute(
            'SELECT * FROM groups WHERE group_id = ?',
            [groupId]
        );

        if (group.length === 0) {
            return res.status(404).json({
                success: false,
                message: '그룹을 찾을 수 없습니다.'
            });
        }

        res.status(200).json({ group: group[0] });
    } catch (error) {
        console.error('그룹 상세 정보 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '그룹 정보를 불러오는데 실패했습니다.'
        });
    }
};

// 그룹 생성
const createGroup = async (req, res) => {
    try {
        const [result] = await db.execute(
            'INSERT INTO groups (name, description, created_by) VALUES (?, ?, ?)',
            [req.body.name, req.body.description, req.user.id]
        );

        if (req.file) {
            await db.execute(
                'UPDATE groups SET image_url = ? WHERE group_id = ?',
                [req.file.path, result.insertId]
            );
        }

        res.status(201).json({
            success: true,
            groupId: result.insertId
        });
    } catch (error) {
        console.error('그룹 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '그룹 생성에 실패했습니다.'
        });
    }
};

// 그룹 목록 조회
const getGroups = async (req, res) => {
    try {
        const [groups] = await db.execute('SELECT * FROM groups ORDER BY created_at DESC');
        res.status(200).json({ groups });
    } catch (error) {
        console.error('그룹 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '그룹 목록을 불러오는데 실패했습니다.'
        });
    }
};

// 최근 활동 그룹 조회
const getRecentGroups = async (req, res) => {
    try {
        const [recentGroups] = await db.execute(
            'SELECT * FROM groups WHERE last_activity_at > DATE_SUB(NOW(), INTERVAL 7 DAY) ORDER BY last_activity_at DESC'
        );
        res.status(200).json({ recentGroups });
    } catch (error) {
        console.error('최근 활동 그룹 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '최근 활동 그룹을 불러오는데 실패했습니다.'
        });
    }
};

// 그룹 삭제
const deleteGroup = async (req, res) => {
    const { groupId } = req.params;
    try {
        await db.execute(
            'DELETE FROM groups WHERE group_id = ? AND created_by = ?',
            [groupId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('그룹 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '그룹 삭제에 실패했습니다.'
        });
    }
};

// 멤버 상세 정보 조회
const getMemberDetail = async (req, res) => {
    const { groupId, memberId } = req.params;
    try {
        const [member] = await db.execute(
            'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
            [groupId, memberId]
        );

        if (member.length === 0) {
            return res.status(404).json({
                success: false,
                message: '멤버를 찾을 수 없습니다.'
            });
        }

        res.status(200).json({ member: member[0] });
    } catch (error) {
        console.error('멤버 상세 정보 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '멤버 정보를 불러오는데 실패했습니다.'
        });
    }
};

// 그룹 멤버 목록 조회
const getGroupMembers = async (req, res) => {
    const { groupId } = req.params;
    const { search, role } = req.query;

    try {
        let query = 'SELECT * FROM group_members WHERE group_id = ?';
        const params = [groupId];

        if (search) {
            query += ' AND name LIKE ?';
            params.push(`%${search}%`);
        }

        if (role) {
            query += ' AND role = ?';
            params.push(role);
        }

        const [members] = await db.execute(query, params);
        const [total] = await db.execute(
            'SELECT COUNT(*) as count FROM group_members WHERE group_id = ?',
            [groupId]
        );

        res.status(200).json({
            members,
            totalCount: total[0].count
        });
    } catch (error) {
        console.error('그룹 멤버 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '멤버 목록을 불러오는데 실패했습니다.'
        });
    }
};

// 가입 요청 목록 조회
const getJoinRequests = async (req, res) => {
    const { groupId } = req.params;
    try {
        const [requests] = await db.execute(
            'SELECT * FROM join_requests WHERE group_id = ? AND status = "pending"',
            [groupId]
        );
        res.status(200).json({ requests });
    } catch (error) {
        console.error('가입 요청 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '가입 요청 목록을 불러오는데 실패했습니다.'
        });
    }
};

// 가입 요청 처리
const handleJoinRequest = async (req, res) => {
    const { groupId, requestId, action } = req.params;
    try {
        await db.execute(
            'UPDATE join_requests SET status = ? WHERE request_id = ? AND group_id = ?',
            [action, requestId, groupId]
        );

        if (action === 'accept') {
            const [request] = await db.execute(
                'SELECT user_id FROM join_requests WHERE request_id = ?',
                [requestId]
            );

            await db.execute(
                'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, "member")',
                [groupId, request[0].user_id]
            );
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('가입 요청 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '가입 요청 처리에 실패했습니다.'
        });
    }
};

// 초대 가능한 멤버 목록 조회
const getAvailableMembers = async (req, res) => {
    const { groupId } = req.params;
    try {
        const [members] = await db.execute(
            `SELECT u.* FROM users u 
             WHERE u.user_id NOT IN 
             (SELECT user_id FROM group_members WHERE group_id = ?)`,
            [groupId]
        );
        res.status(200).json({ members });
    } catch (error) {
        console.error('초대 가능한 멤버 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '초대 가능한 멤버 목록을 불러오는데 실패했습니다.'
        });
    }
};

// 사용자 검색
const searchUsers = async (req, res) => {
    const { query } = req.query;
    try {
        const [users] = await db.execute(
            'SELECT * FROM users WHERE username LIKE ? OR name LIKE ?',
            [`%${query}%`, `%${query}%`]
        );
        res.status(200).json({ users });
    } catch (error) {
        console.error('사용자 검색 오류:', error);
        res.status(500).json({
            success: false,
            message: '사용자 검색에 실패했습니다.'
        });
    }
};

// 멤버 가입 요청 일괄 처리
const handleBulkMemberRequests = async (req, res) => {
    const { groupId } = req.params;
    const { requestIds, action } = req.body;
    try {
        await Promise.all(requestIds.map(requestId =>
            db.execute(
                'UPDATE join_requests SET status = ? WHERE request_id = ? AND group_id = ?',
                [action, requestId, groupId]
            )
        ));

        if (action === 'accept') {
            const [requests] = await db.execute(
                'SELECT user_id FROM join_requests WHERE request_id IN (?)',
                [requestIds]
            );

            await Promise.all(requests.map(request =>
                db.execute(
                    'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, "member")',
                    [groupId, request.user_id]
                )
            ));
        }

        res.status(200).json({
            success: true,
            processedCount: requestIds.length
        });
    } catch (error) {
        console.error('멤버 가입 요청 일괄 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '멤버 가입 요청 일괄 처리에 실패했습니다.'
        });
    }
};

// 멤버 가입 요청 상세 조회
const getMemberRequestDetail = async (req, res) => {
    const { groupId, requestId } = req.params;
    try {
        const [request] = await db.execute(
            'SELECT * FROM join_requests WHERE request_id = ? AND group_id = ?',
            [requestId, groupId]
        );
        res.status(200).json({ request: request[0] });
    } catch (error) {
        console.error('멤버 가입 요청 상세 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '멤버 가입 요청 상세 정보를 불러오는데 실패했습니다.'
        });
    }
};

// 그룹 멤버 추가
const addGroupMember = async (req, res) => {
    const { groupId } = req.params;
    const { memberId } = req.body;
    try {
        await db.execute(
            'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, "member")',
            [groupId, memberId]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('그룹 멤버 추가 오류:', error);
        res.status(500).json({
            success: false,
            message: '그룹 멤버 추가에 실패했습니다.'
        });
    }
};

// 멤버 초대
const inviteMembers = async (req, res) => {
    const { groupId } = req.params;
    const { userIds } = req.body;
    try {
        await Promise.all(userIds.map(userId =>
            db.execute(
                'INSERT INTO group_invitations (group_id, user_id) VALUES (?, ?)',
                [groupId, userId]
            )
        ));
        res.status(200).json({
            success: true,
            invitedCount: userIds.length
        });
    } catch (error) {
        console.error('멤버 초대 오류:', error);
        res.status(500).json({
            success: false,
            message: '멤버 초대에 실패했습니다.'
        });
    }
};

// 초대 코드 생성
const createInvitation = async (req, res) => {
    const { groupId } = req.params;
    try {
        const inviteCode = Math.random().toString(36).substring(2, 15);
        await db.execute(
            'INSERT INTO group_invite_codes (group_id, code) VALUES (?, ?)',
            [groupId, inviteCode]
        );
        res.status(200).json({
            success: true,
            inviteCode
        });
    } catch (error) {
        console.error('초대 코드 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '초대 코드 생성에 실패했습니다.'
        });
    }
};

// 멤버 강퇴
const removeMember = async (req, res) => {
    const { groupId, memberId } = req.params;
    try {
        await db.execute(
            'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
            [groupId, memberId]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('멤버 강퇴 오류:', error);
        res.status(500).json({
            success: false,
            message: '멤버 강퇴에 실패했습니다.'
        });
    }
};

// 멤버 역할 변경
const updateMemberRole = async (req, res) => {
    const { groupId, memberId } = req.params;
    const { role } = req.body;
    try {
        await db.execute(
            'UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?',
            [role, groupId, memberId]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('멤버 역할 변경 오류:', error);
        res.status(500).json({
            success: false,
            message: '멤버 역할 변경에 실패했습니다.'
        });
    }
};

// 그룹 설정 조회
const getGroupSettings = async (req, res) => {
    const { groupId } = req.params;
    try {
        const [settings] = await db.execute(
            'SELECT * FROM group_settings WHERE group_id = ?',
            [groupId]
        );
        res.status(200).json({ settings: settings[0] });
    } catch (error) {
        console.error('그룹 설정 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '그룹 설정을 불러오는데 실패했습니다.'
        });
    }
};

// 그룹 설정 업데이트
const updateGroupSettings = async (req, res) => {
    const { groupId } = req.params;
    const { category, memberLimit } = req.body;
    try {
        await db.execute(
            'UPDATE group_settings SET category = ?, member_limit = ? WHERE group_id = ?',
            [category, memberLimit, groupId]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('그룹 설정 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '그룹 설정 업데이트에 실패했습니다.'
        });
    }
};

// 그룹 이미지 업로드
const uploadGroupImage = async (req, res) => {
    const { groupId } = req.params;
    try {
        if (!req.file) {
            throw new Error('이미지 파일이 없습니다.');
        }

        await db.execute(
            'UPDATE groups SET image_url = ? WHERE group_id = ?',
            [req.file.path, groupId]
        );

        res.status(200).json({
            imageUrl: req.file.path
        });
    } catch (error) {
        console.error('그룹 이미지 업로드 오류:', error);
        res.status(500).json({
            success: false,
            message: '그룹 이미지 업로드에 실패했습니다.'
        });
    }
};

// 그룹 가입
const joinGroup = async (req, res) => {
    const { groupId } = req.params;
    try {
        await db.execute(
            'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, "member")',
            [groupId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('그룹 가입 오류:', error);
        res.status(500).json({
            success: false,
            message: '그룹 가입에 실패했습니다.'
        });
    }
};

// 그룹 탈퇴
const leaveGroup = async (req, res) => {
    const { groupId } = req.params;
    try {
        await db.execute(
            'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
            [groupId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('그룹 탈퇴 오류:', error);
        res.status(500).json({
            success: false,
            message: '그룹 탈퇴에 실패했습니다.'
        });
    }
};

// 멤버 검색
const searchMembers = async (req, res) => {
    const { groupId } = req.params;
    const { query } = req.query;
    try {
        const [members] = await db.execute(
            `SELECT u.* FROM users u 
             JOIN group_members gm ON u.user_id = gm.user_id 
             WHERE gm.group_id = ? AND (u.username LIKE ? OR u.name LIKE ?)`,
            [groupId, `%${query}%`, `%${query}%`]
        );
        res.status(200).json({ members });
    } catch (error) {
        console.error('멤버 검색 오류:', error);
        res.status(500).json({
            success: false,
            message: '멤버 검색에 실패했습니다.'
        });
    }
};

// 피드 액션 처리
const handleFeedAction = async (req, res) => {
    const { groupId, feedId, actionType } = req.params;
    try {
        await db.execute(
            'INSERT INTO feed_actions (feed_id, user_id, action_type) VALUES (?, ?, ?)',
            [feedId, req.user.id, actionType]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('피드 액션 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '피드 액션 처리에 실패했습니다.'
        });
    }
};

module.exports = {
    getGroupActivities,
    getMemberActivities,
    getGroupDetail,
    createGroup,
    getGroups,
    getRecentGroups,
    deleteGroup,
    getMemberDetail,
    getGroupMembers,
    getJoinRequests,
    handleJoinRequest,
    getAvailableMembers,
    searchUsers,
    handleBulkMemberRequests,
    getMemberRequestDetail,
    addGroupMember,
    inviteMembers,
    createInvitation,
    removeMember,
    updateMemberRole,
    getGroupSettings,
    updateGroupSettings,
    uploadGroupImage,
    joinGroup,
    leaveGroup,
    searchMembers,
    handleFeedAction
};