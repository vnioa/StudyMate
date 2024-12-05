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

const inviteController = {
    // 사용자 검색
    searchUsers: async (req, res) => {
        try {
            const { query, type } = req.query;
            const userId = req.user.id;

            const users = await utils.executeQuery(`
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
      `, [userId, `%${query}%`, `%${query}%`, userId, type]);

            res.status(200).json({
                success: true,
                data: users
            });
        } catch (error) {
            console.error('사용자 검색 오류:', error);
            res.status(500).json({
                success: false,
                message: '사용자 검색에 실패했습니다.'
            });
        }
    },

    // 초대장 발송
    sendInvitations: async (req, res) => {
        try {
            const { userIds, type, targetId, message } = req.body;
            const senderId = req.user.id;

            if (!Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '초대할 사용자를 선택해주세요.'
                });
            }

            const result = await utils.executeTransaction(async (connection) => {
                const invitations = [];
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 7);

                for (const receiverId of userIds) {
                    const [existingInvite] = await connection.execute(`
            SELECT id FROM invitations
            WHERE senderId = ? AND receiverId = ?
              AND type = ? AND targetId = ? AND status = 'pending'
          `, [senderId, receiverId, type, targetId]);

                    if (!existingInvite) {
                        const [result] = await connection.execute(`
              INSERT INTO invitations (
                senderId, receiverId, type, targetId,
                message, status, expiresAt, createdAt
              ) VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW())
            `, [senderId, receiverId, type, targetId, message, expiresAt]);

                        await connection.execute(`
              INSERT INTO invitation_history (
                invitationId, action, performedBy,
                note, createdAt
              ) VALUES (?, 'sent', ?, '초대장 발송', NOW())
            `, [result.insertId, senderId]);

                        invitations.push({ id: result.insertId, receiverId });
                    }
                }
                return invitations;
            });

            res.status(201).json({
                success: true,
                message: '초대장이 성공적으로 발송되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('초대장 발송 오류:', error);
            res.status(500).json({
                success: false,
                message: '초대장 발송에 실패했습니다.'
            });
        }
    },

    // 초대 수락
    acceptInvitation: async (req, res) => {
        try {
            const { inviteId } = req.params;
            const userId = req.user.id;

            const result = await utils.executeTransaction(async (connection) => {
                const [invitation] = await connection.execute(`
          SELECT * FROM invitations
          WHERE id = ? AND receiverId = ? AND status = 'pending'
        `, [inviteId, userId]);

                if (!invitation) {
                    throw new Error('유효하지 않은 초대장입니다.');
                }

                if (new Date(invitation.expiresAt) < new Date()) {
                    throw new Error('만료된 초대장입니다.');
                }

                await connection.execute(`
          UPDATE invitations
          SET status = 'accepted', respondedAt = NOW()
          WHERE id = ?
        `, [inviteId]);

                await connection.execute(`
          INSERT INTO invitation_history (
            invitationId, action, performedBy,
            note, createdAt
          ) VALUES (?, 'accepted', ?, '초대 수락', NOW())
        `, [inviteId, userId]);

                if (invitation.type === 'group') {
                    await connection.execute(`
            INSERT INTO study_group_members (
              groupId, memberId, role, joinedAt
            ) VALUES (?, ?, 'member', NOW())
          `, [invitation.targetId, userId]);
                }

                return { success: true };
            });

            res.status(200).json({
                success: true,
                message: '초대가 수락되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('초대 수락 오류:', error);
            res.status(500).json({
                success: false,
                message: '초대 수락에 실패했습니다.'
            });
        }
    },

    // 초대 거절
    rejectInvitation: async (req, res) => {
        try {
            const { inviteId } = req.params;
            const userId = req.user.id;

            const result = await utils.executeTransaction(async (connection) => {
                const [invitation] = await connection.execute(`
          SELECT * FROM invitations
          WHERE id = ? AND receiverId = ? AND status = 'pending'
        `, [inviteId, userId]);

                if (!invitation) {
                    throw new Error('유효하지 않은 초대장입니다.');
                }

                await connection.execute(`
          UPDATE invitations
          SET status = 'rejected', respondedAt = NOW()
          WHERE id = ?
        `, [inviteId]);

                await connection.execute(`
          INSERT INTO invitation_history (
            invitationId, action, performedBy,
            note, createdAt
          ) VALUES (?, 'rejected', ?, '초대 거절', NOW())
        `, [inviteId, userId]);

                return { success: true };
            });

            res.status(200).json({
                success: true,
                message: '초대가 거절되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('초대 거절 오류:', error);
            res.status(500).json({
                success: false,
                message: '초대 거절에 실패했습니다.'
            });
        }
    }
};

module.exports = inviteController;