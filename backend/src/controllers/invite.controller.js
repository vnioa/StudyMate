const inviteService = require('../services/invite.service');

const inviteController = {
    // 사용자 검색
    searchUsers: async (req, res) => {
        try {
            const result = await inviteService.searchUsers(req.query.query);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 초대장 발송
    sendInvitations: async (req, res) => {
        try {
            const result = await inviteService.sendInvitations(req.body.userIds);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 초대 수락
    acceptInvitation: async (req, res) => {
        try {
            const result = await inviteService.acceptInvitation(req.params.inviteId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 초대 거절
    rejectInvitation: async (req, res) => {
        try {
            const result = await inviteService.rejectInvitation(req.params.inviteId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = inviteController;