const express = require('express');
const router = express.Router();
const inviteController = require('../controllers/invite.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validateId, requireFields } = require('../middlewares/validator.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 사용자 검색
router.get('/search', inviteController.searchUsers);

// 초대장 발송
router.post('/send',
    requireFields(['userIds']),
    inviteController.sendInvitations
);

// 초대 수락
router.post('/:inviteId/accept',
    validateId('inviteId'),
    inviteController.acceptInvitation
);

// 초대 거절
router.post('/:inviteId/reject',
    validateId('inviteId'),
    inviteController.rejectInvitation
);

module.exports = router;