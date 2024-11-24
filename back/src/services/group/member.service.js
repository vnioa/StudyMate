const db = require('../../config/mysql');

class MemberService {
    // 멤버 초대
    async inviteMember(groupId, email, inviterId) {
        try {
            // 초대할 사용자 확인
            const [user] = await db.execute(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (user.length === 0) {
                throw new Error('해당 이메일의 사용자를 찾을 수 없습니다.');
            }

            // 이미 멤버인지 확인
            const [existingMember] = await db.execute(
                'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
                [groupId, user[0].id]
            );

            if (existingMember.length > 0) {
                throw new Error('이미 그룹의 멤버입니다.');
            }

            // 초대 생성
            await db.execute(
                'INSERT INTO group_invites (group_id, inviter_id, invitee_id) VALUES (?, ?, ?)',
                [groupId, inviterId, user[0].id]
            );

            return true;
        } catch (error) {
            console.error('멤버 초대 오류:', error);
            throw error;
        }
    }

    // 멤버 승인/거부
    async handleMemberRequest(groupId, userId, action) {
        try {
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

            return true;
        } catch (error) {
            console.error('멤버 요청 처리 오류:', error);
            throw error;
        }
    }

    // 멤버 역할 변경
    async updateMemberRole(groupId, userId, newRole) {
        try {
            await db.execute(
                'UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?',
                [newRole, groupId, userId]
            );

            return true;
        } catch (error) {
            console.error('멤버 역할 변경 오류:', error);
            throw error;
        }
    }

    // 멤버 활동 내역 조회
    async getMemberActivities(groupId, userId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            const [activities] = await db.execute(
                `SELECT * FROM group_activities
                 WHERE group_id = ? AND user_id = ?
                 ORDER BY created_at DESC
                     LIMIT ? OFFSET ?`,
                [groupId, userId, parseInt(limit), offset]
            );

            return activities;
        } catch (error) {
            console.error('멤버 활동 내역 조회 오류:', error);
            throw error;
        }
    }

    // 멘토링 관계 설정
    async assignMentor(groupId, menteeId, mentorId) {
        try {
            await db.execute(
                'INSERT INTO mentoring_relationships (group_id, mentee_id, mentor_id) VALUES (?, ?, ?)',
                [groupId, menteeId, mentorId]
            );

            return true;
        } catch (error) {
            console.error('멘토 배정 오류:', error);
            throw error;
        }
    }

    // 멤버 제거
    async removeMember(groupId, userId) {
        try {
            await db.execute(
                'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
                [groupId, userId]
            );

            return true;
        } catch (error) {
            console.error('멤버 제거 오류:', error);
            throw error;
        }
    }
}

module.exports = new MemberService();