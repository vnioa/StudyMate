const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validateId, requireFields } = require('../middlewares/validator.middleware');
const { createUploadMiddleware, processUploadedFile } = require('../middlewares/upload.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 그룹 활동 관련 라우트
router.get('/:groupId/activities',
    validateId('groupId'),
    groupController.getGroupActivities
);

router.get('/:groupId/mentoring',
    validateId('groupId'),
    groupController.getMentoringInfo
);

router.get('/:groupId/member-activities',
    validateId('groupId'),
    groupController.getMemberActivities
);

// 그룹 기본 정보 관련 라우트
router.get('/:groupId',
    validateId('groupId'),
    groupController.getGroupDetail
);

router.post('/',
    createUploadMiddleware('group')[0],
    processUploadedFile,
    groupController.createGroup
);

router.get('/', groupController.getGroups);

router.get('/recent', groupController.getRecentGroups);

router.delete('/:groupId',
    validateId('groupId'),
    groupController.deleteGroup
);

router.put('/:groupId',
    validateId('groupId'),
    groupController.updateGroup
);

// 멤버 관련 라우트
router.get('/:groupId/members/:memberId',
    validateId('groupId'),
    validateId('memberId'),
    groupController.getMemberDetail
);

router.get('/:groupId/members',
    validateId('groupId'),
    groupController.getGroupMembers
);

router.get('/:groupId/members/search',
    validateId('groupId'),
    groupController.searchMembers
);

// 가입 요청 관련 라우트
router.get('/:groupId/join-requests',
    validateId('groupId'),
    groupController.getJoinRequests
);

router.post('/:groupId/join-requests/:requestId/:action',
    validateId('groupId'),
    validateId('requestId'),
    groupController.handleJoinRequest
);

router.get('/:groupId/available-members',
    validateId('groupId'),
    groupController.getAvailableMembers
);

router.post('/:groupId/requests/bulk',
    validateId('groupId'),
    requireFields(['requestIds', 'action']),
    groupController.handleBulkMemberRequests
);

router.get('/:groupId/requests/:requestId',
    validateId('groupId'),
    validateId('requestId'),
    groupController.getMemberRequestDetail
);

// 멤버 관리 라우트
router.post('/:groupId/members',
    validateId('groupId'),
    requireFields(['memberId']),
    groupController.addGroupMember
);

router.post('/:groupId/invite',
    validateId('groupId'),
    requireFields(['userIds']),
    groupController.inviteMembers
);

router.post('/:groupId/invite-code',
    validateId('groupId'),
    groupController.createInvitation
);

router.delete('/:groupId/members/:memberId',
    validateId('groupId'),
    validateId('memberId'),
    groupController.removeMember
);

router.put('/:groupId/members/:memberId/role',
    validateId('groupId'),
    validateId('memberId'),
    requireFields(['role']),
    groupController.updateMemberRole
);

// 그룹 설정 관련 라우트
router.get('/:groupId/settings',
    validateId('groupId'),
    groupController.getGroupSettings
);

router.put('/:groupId/settings',
    validateId('groupId'),
    groupController.updateGroupSettings
);

router.post('/:groupId/image',
    validateId('groupId'),
    createUploadMiddleware('group')[0],
    processUploadedFile,
    groupController.uploadGroupImage
);

// 그룹 참여 관련 라우트
router.post('/:groupId/join',
    validateId('groupId'),
    groupController.joinGroup
);

router.post('/:groupId/leave',
    validateId('groupId'),
    groupController.leaveGroup
);

// 피드 액션 라우트
router.post('/:groupId/feeds/:feedId/:actionType',
    validateId('groupId'),
    validateId('feedId'),
    groupController.handleFeedAction
);

module.exports = router;