const { dbUtils } = require('../config/db');

const inviteService = {
    // 사용자 검색
    async searchUsers(query) {
        try {
            if (!query || query.length < 2) {
                throw new Error('검색어는 최소 2자 이상이어야 합니다');
            }

            const query = `
                SELECT u.id, u.username, u.email, u.profileImage 
                FROM users u 
                WHERE u.username LIKE ? OR u.email LIKE ?
                LIMIT 10
            `;
            const users = await dbUtils.query(query, [`%${query}%`, `%${query}%`]);

            return { users };
        } catch (error) {
            throw new Error('사용자 검색 실패: ' + error.message);
        }
    },

    // 초대장 발송
    async sendInvitations(userIds, senderId, type, targetId, message) {
        return await dbUtils.transaction(async (connection) => {
            try {
                if (!Array.isArray(userIds) || userIds.length === 0) {
                    throw new Error('유효한 사용자 목록이 필요합니다');
                }

                const invitations = [];
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 7);

                for (const receiverId of userIds) {
                    const [existingInvitation] = await connection.query(`
                        SELECT * FROM invitations 
                        WHERE senderId = ? AND receiverId = ? 
                        AND type = ? AND targetId = ? AND status = 'pending'
                    `, [senderId, receiverId, type, targetId]);

                    if (existingInvitation) continue;

                    const [result] = await connection.query(`
                        INSERT INTO invitations (senderId, receiverId, type, targetId, message, expiresAt)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [senderId, receiverId, type, targetId, message, expiresAt]);

                    await connection.query(`
                        INSERT INTO invitation_history (invitationId, action, performedBy, note)
                        VALUES (?, 'sent', ?, '초대장 발송됨')
                    `, [result.insertId, senderId]);

                    invitations.push(result.insertId);
                }

                return { invitations };
            } catch (error) {
                throw new Error('초대장 발송 실패: ' + error.message);
            }
        });
    },

    // 초대 수락
    async acceptInvitation(inviteId, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [invitation] = await connection.query(`
                    SELECT * FROM invitations
                    WHERE id = ? AND receiverId = ? AND status = 'pending'
                `, [inviteId, userId]);

                if (!invitation) {
                    throw new Error('유효하지 않은 초대장입니다');
                }

                if (new Date() > invitation.expiresAt) {
                    throw new Error('만료된 초대장입니다');
                }

                await connection.query(`
                    UPDATE invitations
                    SET status = 'accepted', respondedAt = NOW()
                    WHERE id = ?
                `, [inviteId]);

                await connection.query(`
                    INSERT INTO invitation_history (invitationId, action, performedBy, note)
                    VALUES (?, 'accepted', ?, '초대 수락됨')
                `, [inviteId, userId]);

                return { success: true };
            } catch (error) {
                throw new Error('초대 수락 실패: ' + error.message);
            }
        });
    },

    // 초대 거절
    async rejectInvitation(inviteId, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [invitation] = await connection.query(`
                    SELECT * FROM invitations
                    WHERE id = ? AND receiverId = ? AND status = 'pending'
                `, [inviteId, userId]);

                if (!invitation) {
                    throw new Error('유효하지 않은 초대장입니다');
                }

                await connection.query(`
                    UPDATE invitations
                    SET status = 'rejected', respondedAt = NOW()
                    WHERE id = ?
                `, [inviteId]);

                await connection.query(`
                    INSERT INTO invitation_history (invitationId, action, performedBy, note)
                    VALUES (?, 'rejected', ?, '초대 거절됨')
                `, [inviteId, userId]);

                return { success: true };
            } catch (error) {
                throw new Error('초대 거절 실패: ' + error.message);
            }
        });
    }
};

module.exports = inviteService;