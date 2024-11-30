const db = require('../config/mysql');
const createError = require('http-errors');

const InviteController = {
    // 사용자 검색
    searchUsers: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { query } = req.query;

            const [users] = await connection.query(
                `SELECT id, user_id, name, email, profile_image
                 FROM users
                 WHERE (name LIKE ? OR user_id LIKE ? OR email LIKE ?)
                   AND id != ?
         AND id NOT IN (
           SELECT invited_user_id 
           FROM invitations 
           WHERE status = 'pending' AND invited_by = ?
         )`,
                [`%${query}%`, `%${query}%`, `%${query}%`, req.user.id, req.user.id]
            );

            res.json({ users });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 초대장 발송
    sendInvitations: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { userIds } = req.body;

            await connection.beginTransaction();

            // 초대장 중복 체크
            const [existing] = await connection.query(
                `SELECT invited_user_id FROM invitations
                 WHERE invited_user_id IN (?)
                   AND invited_by = ?
                   AND status = 'pending'`,
                [userIds, req.user.id]
            );

            if (existing.length > 0) {
                throw createError(400, '이미 초대한 사용자가 포함되어 있습니다.');
            }

            // 초대장 생성
            const invitations = userIds.map(userId => [
                req.user.id,
                userId,
                'pending',
                new Date()
            ]);

            await connection.query(
                `INSERT INTO invitations
                     (invited_by, invited_user_id, status, expires_at)
                 VALUES ?`,
                [invitations]
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

    // 초대 수락
    acceptInvitation: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { inviteId } = req.params;

            await connection.beginTransaction();

            const [invitation] = await connection.query(
                `SELECT * FROM invitations
                 WHERE id = ? AND invited_user_id = ? AND status = 'pending'`,
                [inviteId, req.user.id]
            );

            if (!invitation.length) {
                throw createError(404, '유효하지 않은 초대입니다.');
            }

            if (new Date() > invitation[0].expires_at) {
                throw createError(400, '만료된 초대입니다.');
            }

            await connection.query(
                'UPDATE invitations SET status = "accepted" WHERE id = ?',
                [inviteId]
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

    // 초대 거절
    rejectInvitation: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { inviteId } = req.params;

            const [result] = await connection.query(
                `UPDATE invitations
                 SET status = "rejected"
                 WHERE id = ? AND invited_user_id = ? AND status = 'pending'`,
                [inviteId, req.user.id]
            );

            if (result.affectedRows === 0) {
                throw createError(404, '유효하지 않은 초대입니다.');
            }

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    }
};

module.exports = InviteController;