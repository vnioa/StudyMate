const groupService = require('../services/group.service');
const { CustomError } = require('../utils/error.utils');
const { MEMBER_ROLES, REQUEST_STATUS, ACTIVITY_TYPES } = require('../models/group.model');

const groupController = {
    // 그룹 활동 조회
    async getGroupActivities(req, res, next) {
        try {
            const { groupId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const userId = req.user.id;

            const activities = await groupService.getGroupActivities(groupId, userId, {
                page: parseInt(page),
                limit: parseInt(limit)
            });

            res.status(200).json({
                success: true,
                message: '그룹 활동 내역을 성공적으로 조회했습니다.',
                data: activities
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 멘토링 정보 조회
    async getMentoringInfo(req, res, next) {
        try {
            const { groupId } = req.params;
            const userId = req.user.id;

            const mentoringInfo = await groupService.getMentoringInfo(groupId, userId);

            res.status(200).json({
                success: true,
                message: '멘토링 정보를 성공적으로 조회했습니다.',
                data: mentoringInfo
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 멤버 활동 조회
    async getMemberActivities(req, res, next) {
        try {
            const { groupId } = req.params;
            const userId = req.user.id;
            const { page = 1, limit = 10 } = req.query;

            const activities = await groupService.getMemberActivities(groupId, userId, {
                page: parseInt(page),
                limit: parseInt(limit)
            });

            res.status(200).json({
                success: true,
                message: '멤버 활동 내역을 성공적으로 조회했습니다.',
                data: activities
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 그룹 상세 정보 조회
    async getGroupDetail(req, res, next) {
        try {
            const { groupId } = req.params;
            const userId = req.user.id;

            const groupDetail = await groupService.getGroupDetail(groupId, userId);

            res.status(200).json({
                success: true,
                message: '그룹 상세 정보를 성공적으로 조회했습니다.',
                data: groupDetail
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 그룹 생성
    async createGroup(req, res, next) {
        try {
            const groupData = req.body;
            const image = req.file;
            const userId = req.user.id;

            const group = await groupService.createGroup({
                ...groupData,
                image,
                createdBy: userId
            });

            res.status(201).json({
                success: true,
                message: '그룹이 성공적으로 생성되었습니다.',
                data: group
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 그룹 목록 조회
    async getGroups(req, res, next) {
        try {
            const { page = 1, limit = 10, category, search } = req.query;
            const userId = req.user.id;

            const groups = await groupService.getGroups({
                page: parseInt(page),
                limit: parseInt(limit),
                category,
                search,
                userId
            });

            res.status(200).json({
                success: true,
                message: '그룹 목록을 성공적으로 조회했습니다.',
                data: groups
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 최근 그룹 조회
    async getRecentGroups(req, res, next) {
        try {
            const { limit = 5 } = req.query;
            const userId = req.user.id;

            const groups = await groupService.getRecentGroups(userId, parseInt(limit));

            res.status(200).json({
                success: true,
                message: '최근 그룹 목록을 성공적으로 조회했습니다.',
                data: groups
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 그룹 삭제
    async deleteGroup(req, res, next) {
        try {
            const { groupId } = req.params;
            const userId = req.user.id;

            await groupService.deleteGroup(groupId, userId);

            res.status(200).json({
                success: true,
                message: '그룹이 성공적으로 삭제되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 그룹 수정
    async updateGroup(req, res, next) {
        try {
            const { groupId } = req.params;
            const updateData = req.body;
            const userId = req.user.id;

            const updatedGroup = await groupService.updateGroup(groupId, updateData, userId);

            res.status(200).json({
                success: true,
                message: '그룹 정보가 성공적으로 수정되었습니다.',
                data: updatedGroup
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 멤버 상세 정보 조회
    async getMemberDetail(req, res, next) {
        try {
            const { groupId, memberId } = req.params;
            const userId = req.user.id;

            const memberDetail = await groupService.getMemberDetail(groupId, memberId, userId);

            res.status(200).json({
                success: true,
                message: '멤버 상세 정보를 성공적으로 조회했습니다.',
                data: memberDetail
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 그룹 멤버 목록 조회
    async getGroupMembers(req, res, next) {
        try {
            const { groupId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const userId = req.user.id;

            const members = await groupService.getGroupMembers(groupId, {
                page: parseInt(page),
                limit: parseInt(limit),
                userId
            });

            res.status(200).json({
                success: true,
                message: '그룹 멤버 목록을 성공적으로 조회했습니다.',
                data: members
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 멤버 검색
    async searchMembers(req, res, next) {
        try {
            const { groupId } = req.params;
            const { query } = req.query;
            const userId = req.user.id;

            const members = await groupService.searchMembers(groupId, query, userId);

            res.status(200).json({
                success: true,
                message: '멤버 검색을 완료했습니다.',
                data: members
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 가입 요청 목록 조회
    async getJoinRequests(req, res, next) {
        try {
            const { groupId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const userId = req.user.id;

            const requests = await groupService.getJoinRequests(groupId, {
                page: parseInt(page),
                limit: parseInt(limit),
                userId
            });

            res.status(200).json({
                success: true,
                message: '가입 요청 목록을 성공적으로 조회했습니다.',
                data: requests
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 초대 가능한 멤버 목록 조회
    async getAvailableMembers(req, res, next) {
        try {
            const { groupId } = req.params;
            const { page = 1, limit = 10, search } = req.query;
            const userId = req.user.id;

            const members = await groupService.getAvailableMembers(groupId, {
                page: parseInt(page),
                limit: parseInt(limit),
                search,
                userId
            });

            res.status(200).json({
                success: true,
                message: '초대 가능한 멤버 목록을 성공적으로 조회했습니다.',
                data: members
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 멤버 초대
    async inviteMembers(req, res, next) {
        try {
            const { groupId } = req.params;
            const { userIds } = req.body;
            const userId = req.user.id;

            const result = await groupService.inviteMembers(groupId, userIds, userId);

            res.status(201).json({
                success: true,
                message: '멤버 초대가 성공적으로 완료되었습니다.',
                data: result
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 초대 코드 생성
    async createInvitation(req, res, next) {
        try {
            const { groupId } = req.params;
            const userId = req.user.id;

            const inviteCode = await groupService.createInvitation(groupId, userId);

            res.status(201).json({
                success: true,
                message: '초대 코드가 성공적으로 생성되었습니다.',
                data: { inviteCode }
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 멤버 삭제
    async removeMember(req, res, next) {
        try {
            const { groupId, memberId } = req.params;
            const userId = req.user.id;

            await groupService.removeMember(groupId, memberId, userId);

            res.status(200).json({
                success: true,
                message: '멤버가 성공적으로 삭제되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 그룹 나가기
    async leaveGroup(req, res, next) {
        try {
            const { groupId } = req.params;
            const userId = req.user.id;

            await groupService.leaveGroup(groupId, userId);

            res.status(200).json({
                success: true,
                message: '그룹을 성공적으로 나갔습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 피드 액션 처리
    async handleFeedAction(req, res, next) {
        try {
            const { groupId, feedId, actionType } = req.params;
            const userId = req.user.id;

            if (!Object.values(ACTIVITY_TYPES).includes(actionType)) {
                throw new CustomError('유효하지 않은 액션 타입입니다.', 400);
            }

            const result = await groupService.handleFeedAction(groupId, feedId, actionType, userId);

            res.status(200).json({
                success: true,
                message: '피드 액션이 성공적으로 처리되었습니다.',
                data: result
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    }
};

module.exports = groupController;