const express = require('express');
const router = express.Router();
const {
    searchUsers,
    sendInvitations,
    acceptInvitation,
    rejectInvitation
} = require('../controllers/inviteController');

// 사용자 검색
router.get('/search', searchUsers);

// 초대장 발송
router.post('/send', sendInvitations);

// 초대 수락/거절
router.post('/:inviteId/accept', acceptInvitation);
router.post('/:inviteId/reject', rejectInvitation);

module.exports = router;