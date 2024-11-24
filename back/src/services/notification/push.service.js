const { messaging } = require('../config/firebase');
const db = require('../config/mysql');

class PushService {
    // FCM 토큰 등록/업데이트
    async registerToken(userId, token, deviceInfo) {
        try {
            await db.execute(
                'INSERT INTO device_tokens (user_id, token, device_info, last_used) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE last_used = NOW()',
                [userId, token, JSON.stringify(deviceInfo)]
            );
            return true;
        } catch (error) {
            console.error('FCM 토큰 등록 오류:', error);
            throw error;
        }
    }

    // FCM 토큰 삭제
    async removeToken(userId, token) {
        try {
            await db.execute(
                'DELETE FROM device_tokens WHERE user_id = ? AND token = ?',
                [userId, token]
            );
            return true;
        } catch (error) {
            console.error('FCM 토큰 삭제 오류:', error);
            throw error;
        }
    }

    // 푸시 알림 전송
    async sendPushNotification(userId, title, body, data = {}) {
        try {
            // 사용자의 디바이스 토큰 조회
            const [tokens] = await db.execute(
                'SELECT token FROM device_tokens WHERE user_id = ?',
                [userId]
            );

            if (tokens.length === 0) return;

            const message = {
                notification: {
                    title,
                    body
                },
                data,
                tokens: tokens.map(t => t.token)
            };

            const response = await messaging.sendMulticast(message);

            // 실패한 토큰 처리
            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(tokens[idx].token);
                    }
                });

                // 실패한 토큰 삭제
                if (failedTokens.length > 0) {
                    await db.execute(
                        'DELETE FROM device_tokens WHERE token IN (?)',
                        [failedTokens]
                    );
                }
            }

            return response;
        } catch (error) {
            console.error('푸시 알림 전송 오류:', error);
            throw error;
        }
    }

    // 학습 알림 전송
    async sendStudyNotification(userId, studyData) {
        try {
            const notification = {
                title: '학습 알림',
                body: `${studyData.title} 학습 시간입니다.`
            };

            await this.sendPushNotification(userId, notification.title, notification.body, {
                type: 'STUDY_REMINDER',
                studyId: studyData.id
            });
        } catch (error) {
            console.error('학습 알림 전송 오류:', error);
            throw error;
        }
    }

    // 그룹 활동 알림 전송
    async sendGroupNotification(groupId, title, body) {
        try {
            // 그룹 멤버 조회
            const [members] = await db.execute(
                'SELECT user_id FROM group_members WHERE group_id = ?',
                [groupId]
            );

            for (const member of members) {
                await this.sendPushNotification(member.user_id, title, body, {
                    type: 'GROUP_ACTIVITY',
                    groupId
                });
            }
        } catch (error) {
            console.error('그룹 알림 전송 오류:', error);
            throw error;
        }
    }
}

module.exports = new PushService();