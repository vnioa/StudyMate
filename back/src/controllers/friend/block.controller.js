const db = require('../config/mysql');

class BlockController {
    // 사용자 차단
    async blockUser(req, res) {
        try {
            const { blockedUserId } = req.body;
            const userId = req.user.id;

            // 이미 차단된 사용자인지 확인
            const [existing] = await db.execute(
                'SELECT * FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?',
                [userId, blockedUserId]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '이미 차단된 사용자입니다.'
                });
            }

            await db.execute(
                'INSERT INTO blocked_users (user_id, blocked_user_id) VALUES (?, ?)',
                [userId, blockedUserId]
            );

            res.status(201).json({
                success: true,
                message: '사용자가 차단되었습니다.'
            });
        } catch (error) {
            console.error('사용자 차단 오류:', error);
            res.status(500).json({
                success: false,
                message: '사용자 차단에 실패했습니다.'
            });
        }
    }

    // 차단 해제
    async unblockUser(req, res) {
        try {
            const { blockedUserId } = req.params;
            const userId = req.user.id;

            await db.execute(
                'DELETE FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?',
                [userId, blockedUserId]
            );

            res.status(200).json({
                success: true,
                message: '차단이 해제되었습니다.'
            });
        } catch (error) {
            console.error('차단 해제 오류:', error);
            res.status(500).json({
                success: false,
                message: '차단 해제에 실패했습니다.'
            });
        }
    }

    // 차단된 사용자 목록 조회
    async getBlockedUsers(req, res) {
        try {
            const userId = req.user.id;

            const [blockedUsers] = await db.execute(
                `SELECT b.*, u.username, u.name 
         FROM blocked_users b 
         JOIN users u ON b.blocked_user_id = u.id 
         WHERE b.user_id = ?`,
                [userId]
            );

            res.status(200).json({
                success: true,
                blockedUsers
            });
        } catch (error) {
            console.error('차단 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '차단 목록 조회에 실패했습니다.'
            });
        }
    }

    // 차단 상태 확인
    async checkBlockStatus(req, res) {
        try {
            const { targetUserId } = req.params;
            const userId = req.user.id;

            const [status] = await db.execute(
                'SELECT * FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?',
                [userId, targetUserId]
            );

            res.status(200).json({
                success: true,
                isBlocked: status.length > 0
            });
        } catch (error) {
            console.error('차단 상태 확인 오류:', error);
            res.status(500).json({
                success: false,
                message: '차단 상태 확인에 실패했습니다.'
            });
        }
    }
}

module.exports = new BlockController();