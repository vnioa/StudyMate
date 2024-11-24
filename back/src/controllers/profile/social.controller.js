const db = require('../../config/mysql');
const { sendPushNotification } = require('../../config/firebase');

class SocialController {
    // 소셜 미디어 계정 연동
    async connectSocialAccount(req, res) {
        try {
            const userId = req.user.id;
            const { provider, providerId, accessToken } = req.body;

            // 이미 연동된 계정인지 확인
            const [existingConnection] = await db.execute(
                'SELECT * FROM social_connections WHERE user_id = ? AND provider = ?',
                [userId, provider]
            );

            if (existingConnection.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '이미 연동된 계정입니다.'
                });
            }

            // 소셜 계정 연동 정보 저장
            await db.execute(
                'INSERT INTO social_connections (user_id, provider, provider_id, access_token) VALUES (?, ?, ?, ?)',
                [userId, provider, providerId, accessToken]
            );

            res.status(200).json({
                success: true,
                message: '소셜 미디어 계정이 연동되었습니다.'
            });
        } catch (error) {
            console.error('소셜 계정 연동 오류:', error);
            res.status(500).json({
                success: false,
                message: '소셜 미디어 계정 연동에 실패했습니다.'
            });
        }
    }

    // 연동된 소셜 계정 목록 조회
    async getSocialConnections(req, res) {
        try {
            const userId = req.user.id;
            const [connections] = await db.execute(
                'SELECT provider, provider_id, connected_at FROM social_connections WHERE user_id = ?',
                [userId]
            );

            res.status(200).json({
                success: true,
                connections
            });
        } catch (error) {
            console.error('소셜 계정 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '소셜 미디어 계정 목록 조회에 실패했습니다.'
            });
        }
    }

    // 소셜 계정 연동 해제
    async disconnectSocialAccount(req, res) {
        try {
            const userId = req.user.id;
            const { provider } = req.params;

            const [result] = await db.execute(
                'DELETE FROM social_connections WHERE user_id = ? AND provider = ?',
                [userId, provider]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '연동된 계정을 찾을 수 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                message: '소셜 미디어 계정 연동이 해제되었습니다.'
            });
        } catch (error) {
            console.error('소셜 계정 연동 해제 오류:', error);
            res.status(500).json({
                success: false,
                message: '소셜 미디어 계정 연동 해제에 실패했습니다.'
            });
        }
    }

    // 소셜 로그인
    async socialLogin(req, res) {
        try {
            const { provider, providerId, email, name } = req.body;

            // 기존 연동 계정 확인
            const [existingUser] = await db.execute(
                'SELECT u.* FROM users u JOIN social_connections s ON u.id = s.user_id WHERE s.provider = ? AND s.provider_id = ?',
                [provider, providerId]
            );

            let userId;

            if (existingUser.length === 0) {
                // 새 사용자 생성
                const [newUser] = await db.execute(
                    'INSERT INTO users (email, name) VALUES (?, ?)',
                    [email, name]
                );
                userId = newUser.insertId;

                // 소셜 연동 정보 저장
                await db.execute(
                    'INSERT INTO social_connections (user_id, provider, provider_id) VALUES (?, ?, ?)',
                    [userId, provider, providerId]
                );
            } else {
                userId = existingUser[0].id;
            }

            res.status(200).json({
                success: true,
                message: '소셜 로그인 성공',
                userId
            });
        } catch (error) {
            console.error('소셜 로그인 오류:', error);
            res.status(500).json({
                success: false,
                message: '소셜 로그인에 실패했습니다.'
            });
        }
    }
}

module.exports = new SocialController();