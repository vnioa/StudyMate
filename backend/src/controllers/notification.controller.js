const notificationService = require('../services/notification.service');
const { CustomError } = require('../utils/error.utils');
const { DEVICE_TYPES } = require('../models/notification.model');

const notificationController = {
    // 알림 목록 조회
    async getNotifications(req, res, next) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20, type } = req.query;

            const notifications = await notificationService.getNotifications(userId, {
                page: parseInt(page),
                limit: parseInt(limit),
                type
            });

            res.status(200).json({
                success: true,
                message: '알림 목록을 성공적으로 조회했습니다.',
                data: notifications
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 단일 알림 읽음 처리
    async markAsRead(req, res, next) {
        try {
            const { notificationId } = req.params;
            const userId = req.user.id;

            await notificationService.markAsRead(notificationId, userId);

            res.status(200).json({
                success: true,
                message: '알림을 읽음 처리했습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 모든 알림 읽음 처리
    async markAllAsRead(req, res, next) {
        try {
            const userId = req.user.id;

            await notificationService.markAllAsRead(userId);

            res.status(200).json({
                success: true,
                message: '모든 알림을 읽음 처리했습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 알림 삭제
    async deleteNotification(req, res, next) {
        try {
            const { notificationId } = req.params;
            const userId = req.user.id;

            await notificationService.deleteNotification(notificationId, userId);

            res.status(200).json({
                success: true,
                message: '알림이 성공적으로 삭제되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // FCM 토큰 등록
    async registerFCMToken(req, res, next) {
        try {
            const { token, deviceType = 'android' } = req.body;
            const userId = req.user.id;

            if (!Object.values(DEVICE_TYPES).includes(deviceType)) {
                throw new CustomError('유효하지 않은 기기 유형입니다.', 400);
            }

            await notificationService.registerFCMToken(userId, token, deviceType);

            res.status(201).json({
                success: true,
                message: 'FCM 토큰이 성공적으로 등록되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    }
};

module.exports = notificationController;