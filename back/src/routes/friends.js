const express = require('express');
const router = express.Router();
const friendsController = require('../controllers/friendsController');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validateId, requireFields } = require('../middlewares/validator.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 친구 목록 관련 라우트
router.get('/', friendsController.getFriends);

router.get('/search',
    requireFields(['query']),
    friendsController.searchFriends
);

router.get('/groups', friendsController.getGroups);

// 친구 관리 라우트
router.post('/add',
    requireFields(['friendId']),
    friendsController.addFriend
);

router.delete('/:friendId',
    validateId('friendId'),
    friendsController.removeFriend
);

// 친구 요청 관련 라우트
router.get('/requests', friendsController.getFriendRequests);

router.post('/requests',
    requireFields(['userId', 'message']),
    friendsController.sendFriendRequest
);

router.post('/requests/:requestId/accept',
    validateId('requestId'),
    friendsController.acceptFriendRequest
);

router.post('/requests/:requestId/reject',
    validateId('requestId'),
    friendsController.rejectFriendRequest
);

// 공통 그룹 조회
router.get('/:friendId/groups',
    validateId('friendId'),
    friendsController.getCommonGroups
);

module.exports = router;