const express = require('express');
const router = express.Router();
const memberController = require('../../controllers/group/member.controller');
const auth = require('../../middleware/group/auth.middleware');
const { isGroupAdmin, isMember } = require('../../middleware/group/role.middleware');

// 멤버 초대 및 가입
router.post('/:groupId/invite',
    auth,
    isGroupAdmin(),
    memberController.inviteMember
);

router.post('/:groupId/join',
    auth,
    memberController.handleMemberRequest
);

// 멤버 역할 및 권한 관리
router.put('/:groupId/members/:userId/role',
    auth,
    isGroupAdmin(),
    memberController.updateMemberRole
);

router.put('/:groupId/members/:userId/permissions',
    auth,
    isGroupAdmin(),
    memberController.updateMemberPermissions
);

// 멘토링 관리
router.post('/:groupId/mentoring/assign',
    auth,
    isGroupAdmin(),
    memberController.assignMentor
);

router.put('/:groupId/mentoring/:mentorId/status',
    auth,
    isMember(),
    memberController.updateMentoringStatus
);

// 멤버 활동 관리
router.get('/:groupId/members/:userId/activities',
    auth,
    isMember(),
    memberController.getMemberActivities
);

router.get('/:groupId/members/:userId/contributions',
    auth,
    isMember(),
    memberController.getMemberContributions
);

// 멤버 관리
router.delete('/:groupId/members/:userId',
    auth,
    isGroupAdmin(),
    memberController.removeMember
);

router.put('/:groupId/members/:userId/status',
    auth,
    isGroupAdmin(),
    memberController.updateMemberStatus
);

module.exports = router;