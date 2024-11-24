const db = require('../../config/mysql');
const { sendPushNotification } = require('../../config/firebase');

class NotificationController {
    // 알림 설정 조회
    async getNotificationSettings(req, res) {
        try {
            const userId = req.user.id;
            const [settings] = await db.execute(
                'SELECT push_enabled, email_enabled, priority_level, start_time, end_time, notification_methods, study_alerts FROM notification_settings WHERE user_id = ?',
                [userId]
            );

            if (settings.length === 0) {
                // 기본 설정값 반환
                return res.status(200).json({
                    success: true,
                    settings: {
                        pushEnabled: true,
                        emailEnabled: true,
                        priorityLevel: 'medium',
                        startTime: '09:00',
                        endTime: '22:00',
                        notificationMethods: ['push', 'email'],
                        studyAlerts: true
                    }
                });
            }

            res.status(200).json({
                success: true,
                settings: settings[0]
            });
        } catch (error) {
            console.error('알림 설정 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '알림 설정 조회에 실패했습니다.'
            });
        }
    }

    // 푸시 알림 설정 업데이트
    async updatePushSettings(req, res) {
        try {
            const userId = req.user.id;
            const { enabled } = req.body;

            await db.execute(
                'INSERT INTO notification_settings (user_id, push_enabled) VALUES (?, ?) ON DUPLICATE KEY UPDATE push_enabled = ?',
                [userId, enabled, enabled]
            );

            res.status(200).json({
                success: true,
                message: `푸시 알림이 ${enabled ? '활성화' : '비활성화'}되었습니다.`
            });
        } catch (error) {
            console.error('푸시 알림 설정 오류:', error);
            res.status(500).json({
                success: false,
                message: '푸시 알림 설정에 실패했습니다.'
            });
        }
    }

    // 이메일 알림 설정 업데이트
    async updateEmailSettings(req, res) {
        try {
            const userId = req.user.id;
            const { enabled } = req.body;

            await db.execute(
                'INSERT INTO notification_settings (user_id, email_enabled) VALUES (?, ?) ON DUPLICATE KEY UPDATE email_enabled = ?',
                [userId, enabled, enabled]
            );

            res.status(200).json({
                success: true,
                message: `이메일 알림이 ${enabled ? '활성화' : '비활성화'}되었습니다.`
            });
        } catch (error) {
            console.error('이메일 알림 설정 오류:', error);
            res.status(500).json({
                success: false,
                message: '이메일 알림 설정에 실패했습니다.'
            });
        }
    }

    // 알림 우선순위 설정
    async updatePriorityLevel(req, res) {
        try {
            const userId = req.user.id;
            const { level } = req.body;

            if (!['low', 'medium', 'high'].includes(level)) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 우선순위 레벨입니다.'
                });
            }

            await db.execute(
                'INSERT INTO notification_settings (user_id, priority_level) VALUES (?, ?) ON DUPLICATE KEY UPDATE priority_level = ?',
                [userId, level, level]
            );

            res.status(200).json({
                success: true,
                message: '알림 우선순위가 업데이트되었습니다.'
            });
        } catch (error) {
            console.error('알림 우선순위 설정 오류:', error);
            res.status(500).json({
                success: false,
                message: '알림 우선순위 설정에 실패했습니다.'
            });
        }
    }

    // 알림 수신 시간대 설정
    async updateNotificationTime(req, res) {
        try {
            const userId = req.user.id;
            const { startTime, endTime } = req.body;

            await db.execute(
                'INSERT INTO notification_settings (user_id, start_time, end_time) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE start_time = ?, end_time = ?',
                [userId, startTime, endTime, startTime, endTime]
            );

            res.status(200).json({
                success: true,
                message: '알림 수신 시간이 설정되었습니다.'
            });
        } catch (error) {
            console.error('알림 시간 설정 오류:', error);
            res.status(500).json({
                success: false,
                message: '알림 시간 설정에 실패했습니다.'
            });
        }
    }

    // 학습 관련 알림 설정
    async updateStudyAlerts(req, res) {
        try {
            const userId = req.user.id;
            const { alerts } = req.body;

            await db.execute(
                'INSERT INTO notification_settings (user_id, study_alerts) VALUES (?, ?) ON DUPLICATE KEY UPDATE study_alerts = ?',
                [userId, JSON.stringify(alerts), JSON.stringify(alerts)]
            );

            res.status(200).json({
                success: true,
                message: '학습 알림 설정이 업데이트되었습니다.'
            });
        } catch (error) {
            console.error('학습 알림 설정 오류:', error);
            res.status(500).json({
                success: false,
                message: '학습 알림 설정에 실패했습니다.'
            });
        }
    }
}

module.exports = new NotificationController();