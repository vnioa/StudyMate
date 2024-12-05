const { dbUtils } = require('../config/database.config');

const inviteService = {
    // 사용자 검색
    async searchUsers(query, type, userId) {
        try {
            const searchQuery = `
                SELECT a.id, a.username, a.name, a.profileImage
                FROM auth a
                WHERE a.id != ?
                AND a.status = 'active'
                AND (a.username LIKE ? OR a.name LIKE ?)
                AND a.id NOT IN (
                    SELECT receiverId 
                    FROM invitations 
                    WHERE senderId = ? 
                    AND type = ? 
                    AND status = 'pending'
                )
            `;

            return await dbUtils.query(searchQuery, [
                userId,
                `%${query}%`,
                `%${query}%`,
                userId,
                type
            ]);
        } catch (error) {
            throw new Error('사용자 검색 실패: ' + error.message);
        }
    },

    // 초대장 발송
    async sendInvitations(inviteData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const invitations = [];
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후 만료

                for (const receiverId of inviteData.userIds) {
                    // 기존 초대장 확인
                    const [existingInvite] = await connection.query(`
                        SELECT id FROM invitations
                        WHERE senderId = ? AND receiverId = ?
                          AND type = ? AND targetId = ? AND status = 'pending'
                    `, [inviteData.senderId, receiverId, inviteData.type, inviteData.targetId]);

                    if (!existingInvite) {
                        // 새 초대장 생성
                        const [result] = await connection.query(`
                            INSERT INTO invitations (
                                senderId, receiverId, type, targetId,
                                message, status, expiresAt, createdAt
                            ) VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW())
                        `, [
                            inviteData.senderId,
                            receiverId,
                            inviteData.type,
                            inviteData.targetId,
                            inviteData.message,
                            expiresAt
                        ]);

                        // 초대 이력 기록
                        await connection.query(`
                            INSERT INTO invitation_history (
                                invitationId, action, performedBy,
                                note, createdAt
                            ) VALUES (?, 'sent', ?, '초대장 발송', NOW())
                        `, [result.insertId, inviteData.senderId]);

                        invitations.push({
                            id: result.insertId,
                            receiverId
                        });
                    }
                }

                return invitations;
            } catch (error) {
                throw new Error('초대장 발송 실패: ' + error.message);
            }
        });
    },

    // 초대 처리 (수락/거절)
    async handleInvitation(inviteId, userId, status) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [invitation] = await connection.query(`
                    SELECT * FROM invitations
                    WHERE id = ? AND receiverId = ? AND status = 'pending'
                `, [inviteId, userId]);

                if (!invitation) {
                    throw new Error('유효하지 않은 초대장입니다.');
                }

                if (new Date(invitation.expiresAt) < new Date()) {
                    throw new Error('만료된 초대장입니다.');
                }

                // 초대장 상태 업데이트
                await connection.query(`
                    UPDATE invitations
                    SET status = ?, respondedAt = NOW()
                    WHERE id = ?
                `, [status, inviteId]);

                // 초대 이력 기록
                await connection.query(`
                    INSERT INTO invitation_history (
                        invitationId, action, performedBy,
                        note, createdAt
                    ) VALUES (?, ?, ?, ?, NOW())
                `, [
                    inviteId,
                    status === 'accepted' ? 'accepted' : 'rejected',
                    userId,
                    `초대 ${status === 'accepted' ? '수락' : '거절'}`
                ]);

                // 수락된 경우 추가 처리
                if (status === 'accepted') {
                    switch (invitation.type) {
                        case 'group':
                            await connection.query(`
                                INSERT INTO study_group_members (
                                    groupId, memberId, role, joinedAt
                                ) VALUES (?, ?, 'member', NOW())
                            `, [invitation.targetId, userId]);
                            break;
                        // 다른 타입에 대한 처리 추가 가능
                    }
                }

                return { success: true };
            } catch (error) {
                throw new Error('초대 처리 실패: ' + error.message);
            }
        });
    }
};

module.exports = inviteService;