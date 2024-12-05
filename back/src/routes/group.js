const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
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
    requireFields(['name', 'description', 'category', 'memberLimit', 'isPublic']),
    createUploadMiddleware('group')[0],
    processUploadedFile,
    groupController.createGroup
);

// 멤버 초대 관련 라우트
router.post('/:groupId/invite',
    validateId('groupId'),
    requireFields(['userIds']),
    groupController.inviteMembers
);

router.post('/:groupId/invite-code',
    validateId('groupId'),
    groupController.createInvitation
);

// 그룹 참여 관련 라우트
router.post('/:groupId/join',
    validateId('groupId'),
    groupController.joinGroup
);

// 피드 액션 라우트
router.post('/:groupId/feeds/:feedId/:actionType',
    validateId('groupId'),
    validateId('feedId'),
    groupController.handleFeedAction
);

module.exports = router;