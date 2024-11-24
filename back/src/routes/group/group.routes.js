const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group/group.controller');
const memberController = require('../controllers/group/member.controller');
const auth = require('../middleware/auth');
const { isGroupAdmin, isMember } = require('../middleware/role');
const { upload } = require('../middleware/upload');

// 그룹 생성 및 관리
router.post('/',
    auth,
    groupController.createGroup
);

router.get('/',
    auth,
    groupController.getGroups
);

router.get('/:groupId',
    auth,
    isMember(),
    groupController.getGroupDetails
);

router.put('/:groupId/settings',
    auth,
    isGroupAdmin(),
    groupController.updateGroupSettings
);

router.delete('/:groupId',
    auth,
    isGroupAdmin(),
    groupController.deleteGroup
);

// 그룹 멤버 관리
router.post('/:groupId/members/invite',
    auth,
    isGroupAdmin(),
    memberController.inviteMember
);

router.put('/:groupId/members/:userId',
    auth,
    isGroupAdmin(),
    memberController.handleMemberRequest
);

router.put('/:groupId/members/:userId/role',
    auth,
    isGroupAdmin(),
    memberController.updateMemberRole
);

router.get('/:groupId/members/:userId/activities',
    auth,
    isMember(),
    memberController.getMemberActivities
);

// 그룹 미디어 관리
router.post('/:groupId/media/icon',
    auth,
    isGroupAdmin(),
    upload.single('icon'),
    groupController.updateGroupIcon
);

router.post('/:groupId/media/banner',
    auth,
    isGroupAdmin(),
    upload.single('banner'),
    groupController.updateGroupBanner
);

module.exports = router;