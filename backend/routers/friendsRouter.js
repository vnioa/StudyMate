const express = require('express');
const router = express.Router();
const {
    getFriends,
    searchFriends,
    getGroups,
    addFriend,
    removeFriend,
    updateFriendGroup,
    getFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    sendFriendRequest,
    getFriendProfile,
    toggleBlock,
    toggleHide,
    startChat
} = require('../controllers/friendsController');

// 친구 목록 및 검색
router.get('/', getFriends);
router.get('/search', searchFriends);

// 친구 그룹 관리
router.get('/groups', getGroups);
router.put('/:friendId/group', updateFriendGroup);

// 친구 추가/삭제
router.post('/add', addFriend);
router.delete('/:friendId', removeFriend);

// 친구 요청 관리
router.get('/requests', getFriendRequests);
router.post('/requests', sendFriendRequest);
router.post('/requests/:requestId/accept', acceptFriendRequest);
router.post('/requests/:requestId/reject', rejectFriendRequest);

// 친구 프로필 및 상태 관리
router.get('/:friendId/profile', getFriendProfile);
router.put('/:friendId/block', toggleBlock);
router.put('/:friendId/hide', toggleHide);

// 채팅
router.post('/chat/start', startChat);

module.exports = router;