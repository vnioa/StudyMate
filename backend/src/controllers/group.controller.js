const groupService = require('../services/group.service');

const groupController = {
    // 그룹 활동 관련 컨트롤러
    getGroupActivities: async (req, res) => {
        try {
            const result = await groupService.getGroupActivities(req.params.groupId);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getMentoringInfo: async (req, res) => {
        try {
            const result = await groupService.getMentoringInfo(req.params.groupId);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getMemberActivities: async (req, res) => {
        try {
            const result = await groupService.getMemberActivities(req.params.groupId);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 그룹 기본 정보 관련 컨트롤러
    getGroupDetail: async (req, res) => {
        try {
            const result = await groupService.getGroupDetail(req.params.groupId);
            res.json(result);
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    },

    createGroup: async (req, res) => {
        try {
            const data = { ...req.body, image: req.file };
            const result = await groupService.createGroup(data);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    getGroups: async (req, res) => {
        try {
            const result = await groupService.getGroups();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getRecentGroups: async (req, res) => {
        try {
            const result = await groupService.getRecentGroups();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    deleteGroup: async (req, res) => {
        try {
            const result = await groupService.deleteGroup(req.params.groupId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    updateGroup: async (req, res) => {
        try {
            const result = await groupService.updateGroup(req.params.groupId, req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 멤버 관련 컨트롤러
    getMemberDetail: async (req, res) => {
        try {
            const result = await groupService.getMemberDetail(req.params.groupId, req.params.memberId);
            res.json(result);
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    },

    getGroupMembers: async (req, res) => {
        try {
            const result = await groupService.getGroupMembers(req.params.groupId, req.query);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    searchMembers: async (req, res) => {
        try {
            const result = await groupService.searchMembers(req.params.groupId, req.query.query);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 가입 요청 관련 컨트롤러
    getJoinRequests: async (req, res) => {
        try {
            const result = await groupService.getJoinRequests(req.params.groupId);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    handleJoinRequest: async (req, res) => {
        try {
            const result = await groupService.handleJoinRequest(
                req.params.groupId,
                req.params.requestId,
                req.params.action
            );
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    getAvailableMembers: async (req, res) => {
        try {
            const result = await groupService.getAvailableMembers(req.params.groupId);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    handleBulkMemberRequests: async (req, res) => {
        try {
            const result = await groupService.handleBulkMemberRequests(req.params.groupId, req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    getMemberRequestDetail: async (req, res) => {
        try {
            const result = await groupService.getMemberRequestDetail(
                req.params.groupId,
                req.params.requestId
            );
            res.json(result);
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    },

    // 멤버 관리 컨트롤러
    addGroupMember: async (req, res) => {
        try {
            const result = await groupService.addGroupMember(req.params.groupId, req.body.memberId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    inviteMembers: async (req, res) => {
        try {
            const result = await groupService.inviteMembers(req.params.groupId, req.body.userIds);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    createInvitation: async (req, res) => {
        try {
            const result = await groupService.createInvitation(req.params.groupId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    removeMember: async (req, res) => {
        try {
            const result = await groupService.removeMember(req.params.groupId, req.params.memberId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    updateMemberRole: async (req, res) => {
        try {
            const result = await groupService.updateMemberRole(
                req.params.groupId,
                req.params.memberId,
                req.body.role
            );
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 그룹 설정 관련 컨트롤러
    getGroupSettings: async (req, res) => {
        try {
            const result = await groupService.getGroupSettings(req.params.groupId);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    updateGroupSettings: async (req, res) => {
        try {
            const result = await groupService.updateGroupSettings(req.params.groupId, req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    uploadGroupImage: async (req, res) => {
        try {
            const result = await groupService.uploadGroupImage(req.params.groupId, req.file);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 그룹 참여 관련 컨트롤러
    joinGroup: async (req, res) => {
        try {
            const result = await groupService.joinGroup(req.params.groupId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    leaveGroup: async (req, res) => {
        try {
            const result = await groupService.leaveGroup(req.params.groupId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 피드 액션 컨트롤러
    handleFeedAction: async (req, res) => {
        try {
            const result = await groupService.handleFeedAction(
                req.params.groupId,
                req.params.feedId,
                req.params.actionType
            );
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = groupController;