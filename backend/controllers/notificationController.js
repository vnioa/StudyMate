const db = require('../config/db');

// 알림 목록 조회
const getNotifications = async (req, res) => {
    try {
        const [notifications] = await db.execute(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.status(200).json({
            success: true,
            notifications
        });
    } catch (error) {
        console.error('알림 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 목록을 불러오는데 실패했습니다.'
        });
    }
};

// 알림 읽음 처리
const markAsRead = async (req, res) => {
    const { notificationId } = req.params;
    try {
        await db.execute(
            'UPDATE notifications SET read_at = NOW() WHERE notification_id = ? AND user_id = ?',
            [notificationId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('알림 읽음 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 읽음 처리에 실패했습니다.'
        });
    }
};

// 모든 알림 읽음 처리
const markAllAsRead = async (req, res) => {
    try {
        await db.execute(
            'UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL',
            [req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('모든 알림 읽음 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '모든 알림 읽음 처리에 실패했습니다.'
        });
    }
};

// 알림 삭제
const deleteNotification = async (req, res) => {
    const { notificationId } = req.params;
    try {
        await db.execute(
            'DELETE FROM notifications WHERE notification_id = ? AND user_id = ?',
            [notificationId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('알림 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 삭제에 실패했습니다.'
        });
    }
};

// FCM 토큰 등록
const registerFCMToken = async (req, res) => {
    const { token } = req.body;
    try {
        await db.execute(
            'INSERT INTO fcm_tokens (user_id, token) VALUES (?, ?) ON DUPLICATE KEY UPDATE token = ?',
            [req.user.id, token, token]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('FCM 토큰 등록 오류:', error);
        res.status(500).json({
            success: false,
            message: 'FCM 토큰 등록에 실패했습니다.'
        });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    registerFCMToken
};