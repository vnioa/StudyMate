const friendService = require('../services/friend.service');
const { CustomError } = require('../utils/error.utils');

const friendController = {
    // 친구 목록 조회
    async getFriends(req, res, next) {
        try {
            const userId = req.user.id;
            const friends = await friendService.getFriends(userId);

            res.status(200).json({
                success: true,
                message: '친구 목록을 성공적으로 조회했습니다.',
                data: friends
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 친구 검색
    async searchFriends(req, res, next) {
        try {
            const { query } = req.query;
            const userId = req.user.id;

            const friends = await friendService.searchFriends(query, userId);

            res.status(200).json({
                success: true,
                message: '친구 검색을 완료했습니다.',
                data: friends
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 친구 그룹 목록 조회
    async getGroups(req, res, next) {
        try {
            const userId = req.user.id;
            const groups = await friendService.getGroups(userId);

            res.status(200).json({
                success: true,
                message: '친구 그룹 목록을 성공적으로 조회했습니다.',
                data: groups
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 친구 추가
    async addFriend(req, res, next) {
        try {
            const { friendId } = req.body;
            const userId = req.user.id;

            const result = await friendService.addFriend(userId, friendId);

            res.status(201).json({
                success: true,
                message: '친구가 성공적으로 추가되었습니다.',
                data: result
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 친구 삭제
    async removeFriend(req, res, next) {
        try {
            const { friendId } = req.params;
            const userId = req.user.id;

            await friendService.removeFriend(userId, friendId);

            res.status(200).json({
                success: true,
                message: '친구가 성공적으로 삭제되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 친구 그룹 변경
    async updateFriendGroup(req, res, next) {
        try {
            const { friendId } = req.params;
            const { group } = req.body;
            const userId = req.user.id;

            const result = await friendService.updateFriendGroup(userId, friendId, group);

            res.status(200).json({
                success: true,
                message: '친구 그룹이 성공적으로 변경되었습니다.',
                data: result
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 친구 요청 목록 조회
    async getFriendRequests(req, res, next) {
        try {
            const userId = req.user.id;
            const requests = await friendService.getFriendRequests(userId);

            res.status(200).json({
                success: true,
                message: '친구 요청 목록을 성공적으로 조회했습니다.',
                data: requests
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 친구 요청 수락
    async acceptFriendRequest(req, res, next) {
        try {
            const { requestId } = req.params;
            const userId = req.user.id;

            const result = await friendService.acceptFriendRequest(requestId, userId);

            res.status(200).json({
                success: true,
                message: '친구 요청을 수락했습니다.',
                data: result
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 친구 요청 거절
    async rejectFriendRequest(req, res, next) {
        try {
            const { requestId } = req.params;
            const userId = req.user.id;

            await friendService.rejectFriendRequest(requestId, userId);

            res.status(200).json({
                success: true,
                message: '친구 요청을 거절했습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 친구 요청 보내기
    async sendFriendRequest(req, res, next) {
        try {
            const { userId: receiverId } = req.body;
            const senderId = req.user.id;

            const request = await friendService.sendFriendRequest(senderId, receiverId);

            res.status(201).json({
                success: true,
                message: '친구 요청을 성공적으로 보냈습니다.',
                data: request
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 친구 설정 조회
    async getFriendSettings(req, res, next) {
        try {
            const userId = req.user.id;
            const settings = await friendService.getFriendSettings(userId);

            res.status(200).json({
                success: true,
                message: '친구 설정을 성공적으로 조회했습니다.',
                data: settings
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 친구 설정 업데이트
    async updateFriendSettings(req, res, next) {
        try {
            const userId = req.user.id;
            const settings = req.body;

            const updatedSettings = await friendService.updateFriendSettings(userId, settings);

            res.status(200).json({
                success: true,
                message: '친구 설정이 성공적으로 업데이트되었습니다.',
                data: updatedSettings
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 친구 프로필 조회
    async getFriendProfile(req, res, next) {
        try {
            const { friendId } = req.params;
            const userId = req.user.id;

            const profile = await friendService.getFriendProfile(userId, friendId);

            res.status(200).json({
                success: true,
                message: '친구 프로필을 성공적으로 조회했습니다.',
                data: profile
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 친구 차단/차단 해제
    async toggleBlock(req, res, next) {
        try {
            const { friendId } = req.params;
            const userId = req.user.id;

            const result = await friendService.toggleBlock(userId, friendId);

            res.status(200).json({
                success: true,
                message: result.isBlocked ? '친구를 차단했습니다.' : '친구 차단을 해제했습니다.',
                data: result
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 친구 숨김/숨김 해제
    async toggleHide(req, res, next) {
        try {
            const { friendId } = req.params;
            const userId = req.user.id;

            const result = await friendService.toggleHide(userId, friendId);

            res.status(200).json({
                success: true,
                message: result.isHidden ? '친구를 숨겼습니다.' : '친구 숨김을 해제했습니다.',
                data: result
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 채팅 시작
    async startChat(req, res, next) {
        try {
            const { friendId } = req.body;
            const userId = req.user.id;

            const chat = await friendService.startChat(userId, friendId);

            res.status(201).json({
                success: true,
                message: '채팅방이 생성되었습니다.',
                data: chat
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 공통 그룹 조회
    async getCommonGroups(req, res, next) {
        try {
            const { friendId } = req.params;
            const userId = req.user.id;

            const groups = await friendService.getCommonGroups(userId, friendId);

            res.status(200).json({
                success: true,
                message: '공통 그룹을 성공적으로 조회했습니다.',
                data: groups
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    }
};

module.exports = friendController;