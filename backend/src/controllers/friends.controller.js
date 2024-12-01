const friendsService = require('../services/friends.service');

const friendsController = {
    // 친구 목록 조회
    getFriends: async (req, res) => {
        try {
            const result = await friendsService.getFriends(req.query);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 친구 검색
    searchFriends: async (req, res) => {
        try {
            const result = await friendsService.searchFriends(req.query.query);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 친구 그룹 목록 조회
    getGroups: async (req, res) => {
        try {
            const result = await friendsService.getGroups();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 친구 추가
    addFriend: async (req, res) => {
        try {
            const result = await friendsService.addFriend(req.body.friendId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 친구 삭제
    removeFriend: async (req, res) => {
        try {
            const result = await friendsService.removeFriend(req.params.friendId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 친구 그룹 변경
    updateFriendGroup: async (req, res) => {
        try {
            const result = await friendsService.updateFriendGroup(req.params.friendId, req.body.group);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 친구 요청 목록 조회
    getFriendRequests: async (req, res) => {
        try {
            const result = await friendsService.getFriendRequests();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 친구 요청 수락
    acceptFriendRequest: async (req, res) => {
        try {
            const result = await friendsService.acceptFriendRequest(req.params.requestId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 친구 요청 거절
    rejectFriendRequest: async (req, res) => {
        try {
            const result = await friendsService.rejectFriendRequest(req.params.requestId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 친구 요청 보내기
    sendFriendRequest: async (req, res) => {
        try {
            const result = await friendsService.sendFriendRequest(req.body.userId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 친구 설정 조회
    getFriendSettings: async (req, res) => {
        try {
            const result = await friendsService.getFriendSettings();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 친구 설정 업데이트
    updateFriendSettings: async (req, res) => {
        try {
            const result = await friendsService.updateFriendSettings(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 친구 프로필 조회
    getFriendProfile: async (req, res) => {
        try {
            const result = await friendsService.getFriendProfile(req.params.friendId);
            res.json(result);
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    },

    // 친구 차단/해제
    toggleBlock: async (req, res) => {
        try {
            const result = await friendsService.toggleBlock(req.params.friendId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 친구 숨김/해제
    toggleHide: async (req, res) => {
        try {
            const result = await friendsService.toggleHide(req.params.friendId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 채팅방 시작
    startChat: async (req, res) => {
        try {
            const result = await friendsService.startChat(req.body.friendId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 공통 그룹 조회
    getCommonGroups: async (req, res) => {
        try {
            const result = await friendsService.getCommonGroups(req.params.friendId);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = friendsController;