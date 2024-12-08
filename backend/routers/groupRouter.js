const express = require('express');
const router = express.Router();
const {
    getGroupActivities,
    getMemberActivities,
    getGroupDetail,
    createGroup,
    getGroups,
    getRecentGroups,
    deleteGroup,
    getMemberDetail,
    getGroupMembers,
    getJoinRequests,
    handleJoinRequest,
    getAvailableMembers,
    searchUsers,
    handleBulkMemberRequests,
    getMemberRequestDetail,
    addGroupMember,
    inviteMembers,
    createInvitation,
    removeMember,
    updateMemberRole,
    getGroupSettings,
    updateGroupSettings,
    uploadGroupImage,
    joinGroup,
    leaveGroup,
    searchMembers,
    handleFeedAction
} = require('../controllers/groupController');

// 그룹 기본 CRUD
router.post('/', createGroup);
router.get('/', getGroups);
router.get('/recent', getRecentGroups);
router.get('/:groupId', getGroupDetail);
router.delete('/:groupId', deleteGroup);

// 그룹 활동 관련
router.get('/:groupId/activities', getGroupActivities);
router.get('/:groupId/member-activities', getMemberActivities);

// 멤버 관리
router.get('/:groupId/members', getGroupMembers);
router.post('/:groupId/members', addGroupMember);
router.get('/:groupId/members/search', searchMembers);
router.get('/:groupId/members/:memberId', getMemberDetail);
router.delete('/:groupId/members/:memberId', removeMember);
router.put('/:groupId/members/:memberId/role', updateMemberRole);

// 가입 요청 관리
router.get('/:groupId/join-requests', getJoinRequests);
router.post('/:groupId/join-requests/:requestId/:action', handleJoinRequest);
router.post('/:groupId/requests/bulk', handleBulkMemberRequests);
router.get('/:groupId/requests/:requestId', getMemberRequestDetail);

// 초대 관련
router.get('/:groupId/available-members', getAvailableMembers);
router.post('/:groupId/invite', inviteMembers);
router.post('/:groupId/invite-code', createInvitation);

// 그룹 설정
router.get('/:groupId/settings', getGroupSettings);
router.put('/:groupId/settings', updateGroupSettings);

// 그룹 이미지
router.post('/:groupId/image', uploadGroupImage);

// 그룹 가입/탈퇴
router.post('/:groupId/join', joinGroup);
router.post('/:groupId/leave', leaveGroup);

// 사용자 검색
router.get('/users/search', searchUsers);

// 피드 액션
router.post('/:groupId/feeds/:feedId/:actionType', handleFeedAction);

module.exports = router;