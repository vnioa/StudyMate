const db = require('../config/db');

// 사용자 검색
const searchUsers = async (req, res) => {
    const { query } = req.query;
    try {
        const [users] = await db.execute(
            'SELECT * FROM users WHERE username LIKE ? OR email LIKE ?',
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

// 초대장 발송
const sendInvitations = async (req, res) => {
    const { userIds } = req.body;
    try {
        await Promise.all(userIds.map(userId =>
            db.execute(
                'INSERT INTO invitations (sender_id, recipient_id, status) VALUES (?, ?, "pending")',
                [req.user.id, userId]
            )
        ));
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('초대장 발송 오류:', error);
        res.status(500).json({
            success: false,
            message: '초대장 발송에 실패했습니다.'
        });
    }
};

// 초대 수락
const acceptInvitation = async (req, res) => {
    const { inviteId } = req.params;
    try {
        await db.execute(
            'UPDATE invitations SET status = "accepted" WHERE invitation_id = ? AND recipient_id = ?',
            [inviteId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('초대 수락 오류:', error);
        res.status(500).json({
            success: false,
            message: '초대 수락에 실패했습니다.'
        });
    }
};

// 초대 거절
const rejectInvitation = async (req, res) => {
    const { inviteId } = req.params;
    try {
        await db.execute(
            'UPDATE invitations SET status = "rejected" WHERE invitation_id = ? AND recipient_id = ?',
            [inviteId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('초대 거절 오류:', error);
        res.status(500).json({
            success: false,
            message: '초대 거절에 실패했습니다.'
        });
    }
};

module.exports = {
    searchUsers,
    sendInvitations,
    acceptInvitation,
    rejectInvitation
};