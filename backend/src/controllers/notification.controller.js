const notificationService = require('../services/notification.service');
const { CustomError } = require('../utils/error.utils');
const { DEVICE_TYPES } = require('../models/notification.model');

const notificationController = {
    // 알림 목록 조회
    getNotifications: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { page, limit, type } = req.query;

            const notifications = await notificationService.getNotifications(userId, {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20,
                type
            });

            return res.status(200).json({
                success: true,
                message: '알림 목록을 성공적으로 조회했습니다.',
                data: notifications
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 단일 알림 읽음 처리
    markAsRead: async (req, res, next) => {
        try {
            const { notificationId } = req.params;
            const userId = req.user.id;

            await notificationService.markNotificationAsRead(notificationId, userId);

            return res.status(200).json({
                success: true,
                message: '알림이 읽음 처리되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 모든 알림 읽음 처리
    markAllAsRead: async (req, res, next) => {
        try {
            const userId = req.user.id;

            await notificationService.markAllNotificationsAsRead(userId);

            return res.status(200).json({
                success: true,
                message: '모든 알림이 읽음 처리되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 알림 삭제
    deleteNotification: async (req, res, next) => {
        try {
            const { notificationId } = req.params;
            const userId = req.user.id;

            await notificationService.deleteNotification(notificationId, userId);

            return res.status(200).json({
                success: true,
                message: '알림이 삭제되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // FCM 토큰 등록
    registerFCMToken: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { token, deviceType = 'web', deviceInfo } = req.body;

            if (!Object.values(DEVICE_TYPES).includes(deviceType)) {
                throw new CustomError('유효하지 않은 기기 유형입니다.', 400);
            }

            await notificationService.registerFCMToken(userId, {
                token,
                deviceType,
                deviceInfo
            });

            return res.status(200).json({
                success: true,
                message: 'FCM 토큰이 등록되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    }
};

module.exports = notificationController;