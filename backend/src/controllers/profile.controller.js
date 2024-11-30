const db = require('../config/mysql');
const createError = require('http-errors');

const ProfileController = {
    // 내 프로필 조회
    getMyProfile: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [profile] = await connection.query(
                `SELECT 
          u.id,
          u.user_id,
          u.name,
          u.email,
          u.profile_image,
          u.status_message,
          u.last_login,
          fs.show_online_status,
          fs.allow_friend_requests,
          (SELECT COUNT(*) FROM friends WHERE user_id = u.id) as friends_count,
          (SELECT COUNT(*) FROM friend_requests WHERE receiver_id = u.id AND status = 'pending') as pending_requests
        FROM users u
        LEFT JOIN friend_settings fs ON fs.user_id = u.id
        WHERE u.id = ?`,
                [req.user.id]
            );

            if (!profile.length) {
                throw createError(404, '프로필을 찾을 수 없습니다.');
            }

            // 온라인 상태 업데이트
            await connection.query(
                'UPDATE users SET last_active = NOW() WHERE id = ?',
                [req.user.id]
            );

            res.json({ profile: profile[0] });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 상태 메시지 업데이트
    updateStatus: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { message } = req.body;

            if (message && message.length > 100) {
                throw createError(400, '상태 메시지는 100자를 초과할 수 없습니다.');
            }

            await connection.query(
                'UPDATE users SET status_message = ?, updated_at = NOW() WHERE id = ?',
                [message, req.user.id]
            );

            // 상태 메시지 변경 이력 저장
            await connection.query(
                'INSERT INTO status_history (user_id, status_message) VALUES (?, ?)',
                [req.user.id, message]
            );

            res.json({
                success: true,
                message: '상태 메시지가 업데이트되었습니다.'
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    }
};

module.exports = ProfileController;