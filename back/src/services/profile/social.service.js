const axios = require('axios');
const db = require('../../config/mysql');

class SocialService {
    // 소셜 계정 연동
    async connectSocialAccount(userId, provider, providerData) {
        try {
            const { providerId, accessToken, email } = providerData;

            // 이미 연동된 계정인지 확인
            const [existingConnection] = await db.execute(
                'SELECT * FROM social_connections WHERE user_id = ? AND provider = ?',
                [userId, provider]
            );

            if (existingConnection.length > 0) {
                // 기존 연동 정보 업데이트
                await db.execute(
                    'UPDATE social_connections SET access_token = ?, updated_at = NOW() WHERE user_id = ? AND provider = ?',
                    [accessToken, userId, provider]
                );
            } else {
                // 새로운 연동 정보 추가
                await db.execute(
                    'INSERT INTO social_connections (user_id, provider, provider_id, access_token, email) VALUES (?, ?, ?, ?, ?)',
                    [userId, provider, providerId, accessToken, email]
                );
            }

            return true;
        } catch (error) {
            console.error('소셜 계정 연동 오류:', error);
            throw new Error('소셜 계정 연동에 실패했습니다.');
        }
    }

    // 소셜 계정 연동 해제
    async disconnectSocialAccount(userId, provider) {
        try {
            await db.execute(
                'DELETE FROM social_connections WHERE user_id = ? AND provider = ?',
                [userId, provider]
            );
            return true;
        } catch (error) {
            console.error('소셜 계정 연동 해제 오류:', error);
            throw new Error('소셜 계정 연동 해제에 실패했습니다.');
        }
    }

    // 소셜 로그인 처리
    async handleSocialLogin(provider, providerData) {
        try {
            const { providerId, email, name } = providerData;

            // 기존 연동 계정 확인
            const [existingConnection] = await db.execute(
                'SELECT u.* FROM users u JOIN social_connections s ON u.id = s.user_id WHERE s.provider = ? AND s.provider_id = ?',
                [provider, providerId]
            );

            if (existingConnection.length > 0) {
                return existingConnection[0];
            }

            // 새 사용자 생성
            const [newUser] = await db.execute(
                'INSERT INTO users (email, name) VALUES (?, ?)',
                [email, name]
            );

            // 소셜 연동 정보 저장
            await this.connectSocialAccount(newUser.insertId, provider, providerData);

            return {
                id: newUser.insertId,
                email,
                name
            };
        } catch (error) {
            console.error('소셜 로그인 처리 오류:', error);
            throw new Error('소셜 로그인 처리에 실패했습니다.');
        }
    }

    // 연동된 소셜 계정 목록 조회
    async getSocialConnections(userId) {
        try {
            const [connections] = await db.execute(
                'SELECT provider, provider_id, email, created_at FROM social_connections WHERE user_id = ?',
                [userId]
            );
            return connections;
        } catch (error) {
            console.error('소셜 계정 목록 조회 오류:', error);
            throw new Error('소셜 계정 목록 조회에 실패했습니다.');
        }
    }
}

module.exports = new SocialService();