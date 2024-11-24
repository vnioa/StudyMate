const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friend.controller');
const requestController = require('../controllers/request.controller');
const blockController = require('../controllers/block.controller');
const auth = require('../middleware/auth');

// 친구 관리
router.get('/list',
    auth,
    friendController.getFriends
);

router.delete('/:friendId',
    auth,
    friendController.deleteFriend
);

// 친구 요청
router.post('/request',
    auth,
    requestController.sendRequest
);

router.get('/requests/received',
    auth,
    requestController.getReceivedRequests
);

router.get('/requests/sent',
    auth,
    requestController.getSentRequests
);

router.post('/request/:requestId/respond',
    auth,
    friendController.respondToFriendRequest
);

router.delete('/request/:requestId',
    auth,
    requestController.cancelRequest
);

// 차단 관리
router.post('/block',
    auth,
    blockController.blockUser
);

router.delete('/block/:blockedUserId',
    auth,
    blockController.unblockUser
);

router.get('/blocked',
    auth,
    blockController.getBlockedUsers
);

router.get('/block/status/:targetUserId',
    auth,
    blockController.checkBlockStatus
);

module.exports = router;