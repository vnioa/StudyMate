const groupService = require('../services/group.service');
const { CustomError } = require('../utils/error.utils');
const { MEMBER_ROLES, REQUEST_STATUS } = require('../models/group.model');

const groupController = {
    // 그룹 활동 조회
    getGroupActivities: async (req, res, next) => {
        try {
            const {groupId} = req.params;
            const activities = await groupService.getGroupActivities(groupId);

            return res.status(200).json({
                success: true,
                data: activities
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 멘토링 정보 조회
    getMentoringInfo: async (req, res, next) => {
        try {
            const {groupId} = req.params;
            const mentoringInfo = await groupService.getMentoringInfo(groupId);

            return res.status(200).json({
                success: true,
                data: mentoringInfo
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 멤버 활동 조회
    getMemberActivities: async (req, res, next) => {
        try {
            const {groupId} = req.params;
            const activities = await groupService.getMemberActivities(groupId);

            return res.status(200).json({
                success: true,
                data: activities
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 그룹 상세 정보 조회
    getGroupDetail: async (req, res, next) => {
        try {
            const {groupId} = req.params;
            const userId = req.user.id;

            const group = await groupService.getGroupDetail(groupId, userId);

            return res.status(200).json({
                success: true,
                data: group
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 그룹 생성
    createGroup: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const groupData = {
                ...req.body,
                createdBy: userId,
                image: req.file ? req.file.path : null
            };

            const group = await groupService.createGroup(groupData);

            return res.status(201).json({
                success: true,
                message: '그룹이 생성되었습니다.',
                data: group
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 그룹 목록 조회
    getGroups: async (req, res, next) => {
        try {
            const {category, search, sort} = req.query;
            const groups = await groupService.getGroups({category, search, sort});

            return res.status(200).json({
                success: true,
                data: groups
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 최근 그룹 조회
    getRecentGroups: async (req, res, next) => {
        try {
            const groups = await groupService.getRecentGroups();

            return res.status(200).json({
                success: true,
                data: groups
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 그룹 삭제
    deleteGroup: async (req, res, next) => {
        try {
            const {groupId} = req.params;
            const userId = req.user.id;

            await groupService.deleteGroup(groupId, userId);

            return res.status(200).json({
                success: true,
                message: '그룹이 삭제되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 그룹 정보 수정
    updateGroup: async (req, res, next) => {
        try {
            const {groupId} = req.params;
            const userId = req.user.id;
            const updateData = req.body;

            const updated = await groupService.updateGroup(groupId, userId, updateData);

            return res.status(200).json({
                success: true,
                message: '그룹 정보가 수정되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 멤버 상세 정보 조회
    getMemberDetail: async (req, res, next) => {
        try {
            const {groupId, memberId} = req.params;
            const memberDetail = await groupService.getMemberDetail(groupId, memberId);

            return res.status(200).json({
                success: true,
                data: memberDetail
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 그룹 멤버 목록 조회
    getGroupMembers: async (req, res, next) => {
        try {
            const {groupId} = req.params;
            const members = await groupService.getGroupMembers(groupId);

            return res.status(200).json({
                success: true,
                data: members
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 멤버 검색
    searchMembers: async (req, res, next) => {
        try {
            const {groupId} = req.params;
            const {query} = req.query;

            const members = await groupService.searchMembers(groupId, query);

            return res.status(200).json({
                success: true,
                data: members
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 가입 요청 목록 조회
    getJoinRequests: async (req, res, next) => {
        try {
            const {groupId} = req.params;
            const requests = await groupService.getJoinRequests(groupId);

            return res.status(200).json({
                success: true,
                data: requests
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 가입 요청 처리
    handleJoinRequest: async (req, res, next) => {
        try {
            const {groupId, requestId, action} = req.params;
            const userId = req.user.id;

            await groupService.handleJoinRequest(groupId, requestId, action, userId);

            return res.status(200).json({
                success: true,
                message: `가입 요청이 ${action === 'accept' ? '수락' : '거절'}되었습니다.`
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 초대 가능한 멤버 목록 조회
    getAvailableMembers: async (req, res, next) => {
        try {
            const {groupId} = req.params;
            const members = await groupService.getAvailableMembers(groupId);

            return res.status(200).json({
                success: true,
                data: members
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 다중 멤버 요청 처리
    handleBulkMemberRequests: async (req, res, next) => {
        try {
            const {groupId} = req.params;
            const {requestIds, action} = req.body;
            const userId = req.user.id;

            await groupService.handleBulkMemberRequests(groupId, requestIds, action, userId);

            return res.status(200).json({
                success: true,
                message: '멤버 요청이 처리되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 멤버 요청 상세 조회
    getMemberRequestDetail: async (req, res, next) => {
        try {
            const {groupId, requestId} = req.params;
            const detail = await groupService.getMemberRequestDetail(groupId, requestId);

            return res.status(200).json({
                success: true,
                data: detail
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 그룹 멤버 추가
    addGroupMember: async (req, res, next) => {
        try {
            const {groupId} = req.params;
            const {memberId} = req.body;
            const userId = req.user.id;

            const member = await groupService.addGroupMember(groupId, memberId, userId);

            return res.status(201).json({
                success: true,
                message: '멤버가 추가되었습니다.',
                data: member
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 멤버 초대
    inviteMembers: async (req, res, next) => {
        try {
            const {groupId} = req.params;
            const {userIds} = req.body;
            const userId = req.user.id;

            await groupService.inviteMembers(groupId, userIds, userId);

            return res.status(200).json({
                success: true,
                message: '초대가 발송되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 초대 코드 생성
    createInvitation: async (req, res, next) => {
        try {
            const {groupId} = req.params;
            const userId = req.user.id;

            const invitation = await groupService.createInvitation(groupId, userId);

            return res.status(201).json({
                success: true,
                data: invitation
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 멤버 제거
    removeMember: async (req, res, next) => {
        try {
            const {groupId, memberId} = req.params;
            const userId = req.user.id;

            await groupService.removeMember(groupId, memberId, userId);

            return res.status(200).json({
                success: true,
                message: '멤버가 제거되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 멤버 역할 수정
    updateMemberRole: async (req, res, next) => {
        try {
            const {groupId, memberId} = req.params;
            const {role} = req.body;
            const userId = req.user.id;

            if (!Object.values(MEMBER_ROLES).includes(role)) {
                throw new CustomError('유효하지 않은 역할입니다.', 400);
            }

            const updated = await groupService.updateMemberRole(groupId, memberId, role, userId);

            return res.status(200).json({
                success: true,
                message: '멤버 역할이 수정되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 그룹 설정 조회
    getGroupSettings: async (req, res, next) => {
        try {
            const {groupId} = req.params;
            const settings = await groupService.getGroupSettings(groupId);

            return res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 그룹 설정 수정
    updateGroupSettings: async (req, res, next) => {
        try {
            const {groupId} = req.params;
            const userId = req.user.id;
            const settings = req.body;

            const updated = await groupService.updateGroupSettings(groupId, settings, userId);

            return res.status(200).json({
                success: true,
                message: '그룹 설정이 수정되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 그룹 이미지 업로드
    uploadGroupImage: async (req, res, next) => {
        try {
            const {groupId} = req.params;
            const userId = req.user.id;
            const image = req.file;

            if (!image) {
                throw new CustomError('이미지 파일이 필요합니다.', 400);
            }

            const updated = await groupService.uploadGroupImage(groupId, image.path, userId);

            return res.status(200).json({
                success: true,
                message: '그룹 이미지가 업로드되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 그룹 가입
    joinGroup: async (req, res, next) => {
        try {
            const {groupId} = req.params;
            const userId = req.user.id;
            const {message} = req.body;

            await groupService.joinGroup(groupId, userId, message);

            return res.status(200).json({
                success: true,
                message: '그룹 가입 요청이 전송되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 그룹 탈퇴
    leaveGroup: async (req, res, next) => {
        try {
            const {groupId} = req.params;
            const userId = req.user.id;

            await groupService.leaveGroup(groupId, userId);

            return res.status(200).json({
                success: true,
                message: '그룹에서 탈퇴했습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    }
};

module.exports = groupController;