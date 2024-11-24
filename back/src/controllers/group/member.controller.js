const db = require('../../config/mysql');
const { messaging } = require('../../config/firebase');

class MemberController {
    // 멤버 초대
    async inviteMember(req, res) {
        try {
            const { groupId, email } = req.body;
            const inviterId = req.user.id;

            // 초대할 사용자 확인
            const [user] = await db.execute(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (user.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '해당 이메일의 사용자를 찾을 수 없습니다.'
                });
            }

            // 이미 멤버인지 확인
            const [existingMember] = await db.execute(
                'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
                [groupId, user[0].id]
            );

            if (existingMember.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '이미 그룹의 멤버입니다.'
                });
            }

            // 초대 생성
            await db.execute(
                'INSERT INTO group_invites (group_id, inviter_id, invitee_id) VALUES (?, ?, ?)',
                [groupId, inviterId, user[0].id]
            );

            // 초대 알림 전송
            await messaging.send({
                token: user[0].fcm_token,
                notification: {
                    title: '그룹 초대',
                    body: '새로운 그룹 초대가 도착했습니다.'
                }
            });

            res.status(200).json({
                success: true,
                message: '초대가 전송되었습니다.'
            });
        } catch (error) {
            console.error('멤버 초대 오류:', error);
            res.status(500).json({
                success: false,
                message: '멤버 초대에 실패했습니다.'
            });
        }
    }

    // 멤버 승인/거부
    async handleMemberRequest(req, res) {
        try {
            const { groupId, userId, action } = req.body;
            const adminId = req.user.id;

            // 관리자 권한 확인
            const [admin] = await db.execute(
                'SELECT * FROM group_members WHERE group_id = ? AND user_id = ? AND role = ?',
                [groupId, adminId, 'admin']
            );

            if (admin.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: '멤버 관리 권한이 없습니다.'
                });
            }

            if (action === 'approve') {
                await db.execute(
                    'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
                    [groupId, userId, 'member']
                );
            }

            await db.execute(
                'DELETE FROM group_invites WHERE group_id = ? AND invitee_id = ?',
                [groupId, userId]
            );

            res.status(200).json({
                success: true,
                message: action === 'approve' ? '멤버가 승인되었습니다.' : '초대가 거부되었습니다.'
            });
        } catch (error) {
            console.error('멤버 요청 처리 오류:', error);
            res.status(500).json({
                success: false,
                message: '멤버 요청 처리에 실패했습니다.'
            });
        }
    }

    // 멤버 역할 변경
    async updateMemberRole(req, res) {
        try {
            const { groupId, userId, newRole } = req.body;
            const adminId = req.user.id;

            // 관리자 권한 확인
            const [admin] = await db.execute(
                'SELECT * FROM group_members WHERE group_id = ? AND user_id = ? AND role = ?',
                [groupId, adminId, 'admin']
            );

            if (admin.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: '역할 변경 권한이 없습니다.'
                });
            }

            await db.execute(
                'UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?',
                [newRole, groupId, userId]
            );

            res.status(200).json({
                success: true,
                message: '멤버 역할이 변경되었습니다.'
            });
        } catch (error) {
            console.error('멤버 역할 변경 오류:', error);
            res.status(500).json({
                success: false,
                message: '멤버 역할 변경에 실패했습니다.'
            });
        }
    }

    // 멤버 활동 내역 조회
    async getMemberActivities(req, res) {
        try {
            const { groupId, userId, page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            const [activities] = await db.execute(
                `SELECT * FROM group_activities 
         WHERE group_id = ? AND user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
                [groupId, userId, parseInt(limit), offset]
            );

            res.status(200).json({
                success: true,
                activities
            });
        } catch (error) {
            console.error('멤버 활동 내역 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '멤버 활동 내역 조회에 실패했습니다.'
            });
        }
    }
}

module.exports = new MemberController();