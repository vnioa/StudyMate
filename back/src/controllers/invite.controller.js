const inviteService = require('../services/invite.service');
const { CustomError } = require('../utils/error.utils');
const { INVITATION_STATUS } = require('../models/invite.model');

const inviteController = {
    // 사용자 검색
    searchUsers: async (req, res, next) => {
        try {
            const { query, type } = req.query;
            const userId = req.user.id;

            const users = await inviteService.searchUsers(query, type, userId);

            return res.status(200).json({
                success: true,
                data: users
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 초대장 발송
    sendInvitations: async (req, res, next) => {
        try {
            const { userIds, type, targetId, message } = req.body;
            const senderId = req.user.id;

            if (!Array.isArray(userIds) || userIds.length === 0) {
                throw new CustomError('초대할 사용자를 선택해주세요.', 400);
            }

            const invitations = await inviteService.sendInvitations({
                senderId,
                userIds,
                type,
                targetId,
                message
            });

            return res.status(201).json({
                success: true,
                message: '초대장이 성공적으로 발송되었습니다.',
                data: invitations
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 초대 수락
    acceptInvitation: async (req, res, next) => {
        try {
            const { inviteId } = req.params;
            const userId = req.user.id;

            const result = await inviteService.handleInvitation(inviteId, userId, INVITATION_STATUS.ACCEPTED);

            return res.status(200).json({
                success: true,
                message: '초대가 수락되었습니다.',
                data: result
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 초대 거절
    rejectInvitation: async (req, res, next) => {
        try {
            const { inviteId } = req.params;
            const userId = req.user.id;

            const result = await inviteService.handleInvitation(inviteId, userId, INVITATION_STATUS.REJECTED);

            return res.status(200).json({
                success: true,
                message: '초대가 거절되었습니다.',
                data: result
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    }
};

module.exports = inviteController;