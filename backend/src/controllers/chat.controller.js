const chatService = require('../services/chat.service');
const { CustomError } = require('../utils/error.utils');
const { MESSAGE_TYPES } = require('../models/chat.model');

const chatController = {
    // 읽지 않은 메시지 수 조회
    async getUnreadCount(req, res, next) {
        try {
            const userId = req.user.id;
            const count = await chatService.getUnreadCount(userId);

            res.json({
                success: true,
                data: { unreadCount: count }
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 채팅방 생성
    async createChatRoom(req, res, next) {
        try {
            const { type, participants, name } = req.body;
            const userId = req.user.id;

            if (!participants || !Array.isArray(participants) || participants.length === 0) {
                throw new CustomError('참여자 목록이 필요합니다.', 400);
            }

            const chatRoom = await chatService.createChatRoom({
                type,
                name,
                creatorId: userId,
                participants: [...participants, userId]
            });

            res.status(201).json({
                success: true,
                data: chatRoom
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 채팅방 목록 조회
    async getChatRooms(req, res, next) {
        try {
            const userId = req.user.id;
            const rooms = await chatService.getChatRooms(userId);

            res.json({
                success: true,
                data: rooms
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 채팅방 검색
    async searchRooms(req, res, next) {
        try {
            const { query } = req.query;
            const userId = req.user.id;

            const rooms = await chatService.searchRooms(query, userId);

            res.json({
                success: true,
                data: rooms
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 채팅방 상세 조회
    async getChatRoom(req, res, next) {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;

            const room = await chatService.getChatRoom(roomId, userId);

            res.json({
                success: true,
                data: room
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 메시지 전송
    async sendMessage(req, res, next) {
        try {
            const { roomId } = req.params;
            const { content, type } = req.body;
            const userId = req.user.id;

            const message = await chatService.sendMessage({
                roomId,
                senderId: userId,
                content,
                type: type || MESSAGE_TYPES.TEXT
            });

            res.status(201).json({
                success: true,
                data: message
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 이미지 메시지 전송
    async sendImageMessage(req, res, next) {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;
            const image = req.file;

            if (!image) {
                throw new CustomError('이미지 파일이 필요합니다.', 400);
            }

            const message = await chatService.sendImageMessage({
                roomId,
                senderId: userId,
                image
            });

            res.status(201).json({
                success: true,
                data: message
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 메시지 읽음 처리
    async markAsRead(req, res, next) {
        try {
            const { roomId, messageId } = req.params;
            const userId = req.user.id;

            await chatService.markAsRead(roomId, messageId, userId);

            res.json({
                success: true,
                message: '메시지를 읽음 처리했습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 채팅방 설정 업데이트
    async updateRoomSettings(req, res, next) {
        try {
            const { roomId } = req.params;
            const { notification, encryption, theme, roomName } = req.body;
            const userId = req.user.id;

            const settings = await chatService.updateRoomSettings(roomId, {
                notification,
                encryption,
                theme,
                name: roomName,
                updatedBy: userId
            });

            res.json({
                success: true,
                data: settings
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 채팅방 참여자 관리
    async updateParticipants(req, res, next) {
        try {
            const { roomId } = req.params;
            const { participants } = req.body;
            const userId = req.user.id;

            await chatService.updateParticipants(roomId, participants, userId);

            res.json({
                success: true,
                message: '참여자 목록이 업데이트되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 채팅방 나가기
    async leaveRoom(req, res, next) {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;

            await chatService.leaveRoom(roomId, userId);

            res.json({
                success: true,
                message: '채팅방을 나갔습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 메시지 중요 표시 토글
    async toggleImportant(req, res, next) {
        try {
            const { messageId } = req.params;
            const userId = req.user.id;

            const result = await chatService.toggleImportant(messageId, userId);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 채팅방 고정/고정해제
    async pinChatRoom(req, res, next) {
        try {
            const { roomId } = req.params;
            const { isPinned } = req.body;
            const userId = req.user.id;

            await chatService.pinChatRoom(roomId, isPinned, userId);

            res.json({
                success: true,
                message: isPinned ? '채팅방을 고정했습니다.' : '채팅방 고정을 해제했습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    }
};

module.exports = chatController;