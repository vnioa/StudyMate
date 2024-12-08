const express = require('express');
const router = express.Router();
const friendsController = require('../controllers/friends.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validateId, requireFields } = require('../middlewares/validator.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 친구 목록 조회
router.get('/', friendsController.getFriends);

// 친구 검색
router.get('/search', friendsController.searchFriends);

// 친구 그룹 목록 조회
router.get('/groups', friendsController.getGroups);

// 친구 추가
router.post('/add',
    requireFields(['friendId']),
    friendsController.addFriend
);

// 친구 삭제
router.delete('/:friendId',
    validateId('friendId'),
    friendsController.removeFriend
);

// 친구 그룹 변경
router.put('/:friendId/group',
    validateId('friendId'),
    requireFields(['group']),
    friendsController.updateFriendGroup
);

// 친구 요청 관련 라우트
router.get('/requests', friendsController.getFriendRequests);

router.post('/requests/:requestId/accept',
    validateId('requestId'),
    friendsController.acceptFriendRequest
);

router.post('/requests/:requestId/reject',
    validateId('requestId'),
    friendsController.rejectFriendRequest
);

router.post('/requests',
    requireFields(['userId']),
    friendsController.sendFriendRequest
);

// 친구 설정 관련 라우트
router.get('/settings', friendsController.getFriendSettings);

router.put('/settings',
    requireFields(['allowFriendRequests', 'showOnlineStatus']),
    friendsController.updateFriendSettings
);

// 친구 프로필 관련 라우트
router.get('/:friendId/profile',
    validateId('friendId'),
    friendsController.getFriendProfile
);

router.put('/:friendId/block',
    validateId('friendId'),
    friendsController.toggleBlock
);

router.put('/:friendId/hide',
    validateId('friendId'),
    friendsController.toggleHide
);

// 채팅 시작
router.post('/chat/start',
    requireFields(['friendId']),
    friendsController.startChat
);

// 공통 그룹 조회
router.get('/:friendId/groups',
    validateId('friendId'),
    friendsController.getCommonGroups
);

module.exports = router;