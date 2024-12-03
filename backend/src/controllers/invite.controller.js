const inviteService = require('../services/invite.service');
const { CustomError } = require('../utils/error.utils');
const { INVITATION_STATUS } = require('../models/invite.model');

const inviteController = {
    // 사용자 검색
    async searchUsers(req, res, next) {
        try {
            const { query, limit = 10 } = req.query;
            const userId = req.user.id;

            if (!query || query.length < 2) {
                throw new CustomError('검색어는 2자 이상이어야 합니다.', 400);
            }

            const users = await inviteService.searchUsers(query, userId, parseInt(limit));

            res.status(200).json({
                success: true,
                message: '사용자 검색을 완료했습니다.',
                data: users
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 초대장 발송
    async sendInvitations(req, res, next) {
        try {
            const { userIds, type, targetId, message, expiresAt } = req.body;
            const senderId = req.user.id;

            if (!Array.isArray(userIds) || userIds.length === 0) {
                throw new CustomError('유효한 사용자 목록이 필요합니다.', 400);
            }

            const invitations = await inviteService.sendInvitations({
                userIds,
                senderId,
                type,
                targetId,
                message,
                expiresAt: expiresAt ? new Date(expiresAt) : null
            });

            res.status(201).json({
                success: true,
                message: `${userIds.length}명의 사용자에게 초대장을 발송했습니다.`,
                data: invitations
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 초대 수락
    async acceptInvitation(req, res, next) {
        try {
            const { inviteId } = req.params;
            const userId = req.user.id;

            const result = await inviteService.handleInvitation(inviteId, userId, INVITATION_STATUS.ACCEPTED);

            res.status(200).json({
                success: true,
                message: '초대를 수락했습니다.',
                data: result
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 초대 거절
    async rejectInvitation(req, res, next) {
        try {
            const { inviteId } = req.params;
            const userId = req.user.id;

            const result = await inviteService.handleInvitation(inviteId, userId, INVITATION_STATUS.REJECTED);

            res.status(200).json({
                success: true,
                message: '초대를 거절했습니다.',
                data: result
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    }
};

module.exports = inviteController;