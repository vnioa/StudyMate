const friendsService = require('../services/friends.service');
const { CustomError } = require('../utils/error.utils');

const friendsController = {
    // 친구 목록 조회
    getFriends: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { group } = req.query;

            const friends = await friendsService.getFriends(userId, group);

            return res.status(200).json({
                success: true,
                message: '친구 목록을 성공적으로 조회했습니다.',
                data: friends
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 친구 검색
    searchFriends: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { query } = req.query;

            const friends = await friendsService.searchFriends(userId, query);

            return res.status(200).json({
                success: true,
                data: friends
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 친구 그룹 목록 조회
    getGroups: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const groups = await friendsService.getFriendGroups(userId);

            return res.status(200).json({
                success: true,
                data: groups
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 친구 추가
    addFriend: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { friendId } = req.body;

            const friend = await friendsService.addFriend(userId, friendId);

            return res.status(201).json({
                success: true,
                message: '친구가 추가되었습니다.',
                data: friend
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 친구 삭제
    removeFriend: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { friendId } = req.params;

            await friendsService.removeFriend(userId, friendId);

            return res.status(200).json({
                success: true,
                message: '친구가 삭제되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 친구 그룹 변경
    updateFriendGroup: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { friendId } = req.params;
            const { group } = req.body;

            const updated = await friendsService.updateFriendGroup(userId, friendId, group);

            return res.status(200).json({
                success: true,
                message: '친구 그룹이 변경되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 친구 요청 목록 조회
    getFriendRequests: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const requests = await friendsService.getFriendRequests(userId);

            return res.status(200).json({
                success: true,
                data: requests
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 친구 요청 수락
    acceptFriendRequest: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { requestId } = req.params;

            await friendsService.acceptFriendRequest(userId, requestId);

            return res.status(200).json({
                success: true,
                message: '친구 요청이 수락되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 친구 요청 거절
    rejectFriendRequest: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { requestId } = req.params;

            await friendsService.rejectFriendRequest(userId, requestId);

            return res.status(200).json({
                success: true,
                message: '친구 요청이 거절되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 친구 요청 보내기
    sendFriendRequest: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { userId: targetId, message } = req.body;

            const request = await friendsService.sendFriendRequest(userId, targetId, message);

            return res.status(201).json({
                success: true,
                message: '친구 요청을 보냈습니다.',
                data: request
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 친구 설정 조회
    getFriendSettings: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const settings = await friendsService.getFriendSettings(userId);

            return res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 친구 설정 업데이트
    updateFriendSettings: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const settings = req.body;

            const updated = await friendsService.updateFriendSettings(userId, settings);

            return res.status(200).json({
                success: true,
                message: '친구 설정이 업데이트되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 친구 프로필 조회
    getFriendProfile: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { friendId } = req.params;

            const profile = await friendsService.getFriendProfile(userId, friendId);

            return res.status(200).json({
                success: true,
                data: profile
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 친구 차단/차단해제
    toggleBlock: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { friendId } = req.params;

            const result = await friendsService.toggleFriendBlock(userId, friendId);

            return res.status(200).json({
                success: true,
                message: result.isBlocked ? '친구가 차단되었습니다.' : '친구 차단이 해제되었습니다.',
                data: result
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 친구 숨김/숨김해제
    toggleHide: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { friendId } = req.params;

            const result = await friendsService.toggleFriendHide(userId, friendId);

            return res.status(200).json({
                success: true,
                message: result.isHidden ? '친구가 숨김처리되었습니다.' : '친구 숨김이 해제되었습니다.',
                data: result
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 채팅 시작
    startChat: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { friendId } = req.body;

            const chat = await friendsService.startFriendChat(userId, friendId);

            return res.status(201).json({
                success: true,
                message: '채팅이 시작되었습니다.',
                data: chat
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 공통 그룹 조회
    getCommonGroups: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { friendId } = req.params;

            const groups = await friendsService.getCommonGroups(userId, friendId);

            return res.status(200).json({
                success: true,
                data: groups
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    }
};

module.exports = friendsController;