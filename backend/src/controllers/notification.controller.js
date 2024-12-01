const notificationService = require('../services/notification.service');

const notificationController = {
    // 알림 목록 조회
    getNotifications: async (req, res) => {
        try {
            const result = await notificationService.getNotifications();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 알림 읽음 처리
    markAsRead: async (req, res) => {
        try {
            const result = await notificationService.markAsRead(req.params.notificationId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 모든 알림 읽음 처리
    markAllAsRead: async (req, res) => {
        try {
            const result = await notificationService.markAllAsRead();
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 알림 삭제
    deleteNotification: async (req, res) => {
        try {
            const result = await notificationService.deleteNotification(req.params.notificationId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // FCM 토큰 등록
    registerFCMToken: async (req, res) => {
        try {
            const result = await notificationService.registerFCMToken(req.body.token);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = notificationController;