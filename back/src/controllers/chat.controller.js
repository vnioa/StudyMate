const chatService = require('../services/chat.service');
const { CustomError } = require('../utils/error.utils');
const { MESSAGE_TYPES } = require('../models/chat.model');

const chatController = {
    // 읽지 않은 메시지 수 조회
    getUnreadCount: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const count = await chatService.getUnreadMessageCount(userId);

            return res.status(200).json({
                success: true,
                data: { unreadCount: count }
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 채팅방 생성
    createChatRoom: async (req, res, next) => {
        try {
            const { type, participants, name } = req.body;
            const userId = req.user.id;

            const chatRoom = await chatService.createChatRoom({
                type,
                name,
                participants: [...participants, userId],
                createdBy: userId
            });

            return res.status(201).json({
                success: true,
                message: '채팅방이 생성되었습니다.',
                data: chatRoom
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 채팅방 목록 조회
    getChatRooms: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const rooms = await chatService.getChatRooms(userId);

            return res.status(200).json({
                success: true,
                data: rooms
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 채팅방 검색
    searchRooms: async (req, res, next) => {
        try {
            const { query } = req.query;
            const userId = req.user.id;

            const rooms = await chatService.searchChatRooms(userId, query);

            return res.status(200).json({
                success: true,
                data: rooms
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 채팅방 상세 조회
    getChatRoom: async (req, res, next) => {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;

            const room = await chatService.getChatRoomDetail(roomId, userId);

            return res.status(200).json({
                success: true,
                data: room
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 채팅방 설정 조회
    getRoomDetail: async (req, res, next) => {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;

            const settings = await chatService.getRoomSettings(roomId, userId);

            return res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 채팅방 설정 업데이트
    updateRoomSettings: async (req, res, next) => {
        try {
            const { roomId } = req.params;
            const { notification, encryption, theme, roomName } = req.body;
            const userId = req.user.id;

            const updated = await chatService.updateRoomSettings(roomId, userId, {
                notification,
                encryption,
                theme,
                name: roomName
            });

            return res.status(200).json({
                success: true,
                message: '채팅방 설정이 업데이트되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 메시지 전송
    sendMessage: async (req, res, next) => {
        try {
            const { roomId } = req.params;
            const { content, type } = req.body;
            const userId = req.user.id;

            const message = await chatService.sendMessage({
                roomId,
                senderId: userId,
                content,
                type
            });

            return res.status(201).json({
                success: true,
                data: message
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 이미지 메시지 전송
    sendImageMessage: async (req, res, next) => {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;
            const image = req.file;

            if (!image) {
                throw new CustomError('이미지 파일이 필요합니다.', 400);
            }

            const message = await chatService.sendImageMessage(roomId, userId, image);

            return res.status(201).json({
                success: true,
                data: message
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 메시지 읽음 처리
    markAsRead: async (req, res, next) => {
        try {
            const { roomId, messageId } = req.params;
            const userId = req.user.id;

            await chatService.markMessageAsRead(roomId, messageId, userId);

            return res.status(200).json({
                success: true,
                message: '메시지가 읽음 처리되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 메시지 중요 표시 토글
    toggleImportant: async (req, res, next) => {
        try {
            const { messageId } = req.params;
            const userId = req.user.id;

            const updated = await chatService.toggleMessageImportant(messageId, userId);

            return res.status(200).json({
                success: true,
                message: '메시지 중요 표시가 토글되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 채팅방 나가기
    leaveRoom: async (req, res, next) => {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;

            await chatService.leaveChatRoom(roomId, userId);

            return res.status(200).json({
                success: true,
                message: '채팅방을 나갔습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 채팅방 이름 변경
    updateRoomName: async (req, res, next) => {
        try {
            const { roomId } = req.params;
            const { roomName } = req.body;
            const userId = req.user.id;

            if (!roomName || roomName.trim().length === 0) {
                throw new CustomError('채팅방 이름은 필수입니다.', 400);
            }

            const updated = await chatService.updateRoomName(roomId, roomName, userId);

            return res.status(200).json({
                success: true,
                message: '채팅방 이름이 변경되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

// 채팅방 참여자 관리
    updateParticipants: async (req, res, next) => {
        try {
            const { roomId } = req.params;
            const { participants } = req.body;
            const userId = req.user.id;

            if (!Array.isArray(participants)) {
                throw new CustomError('참여자 목록이 유효하지 않습니다.', 400);
            }

            const updated = await chatService.updateRoomParticipants(roomId, participants, userId);

            return res.status(200).json({
                success: true,
                message: '채팅방 참여자가 업데이트되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

// 채팅방 고정/고정해제
    pinChatRoom: async (req, res, next) => {
        try {
            const { roomId } = req.params;
            const { isPinned } = req.body;
            const userId = req.user.id;

            const updated = await chatService.toggleRoomPin(roomId, isPinned, userId);

            return res.status(200).json({
                success: true,
                message: isPinned ? '채팅방이 고정되었습니다.' : '채팅방 고정이 해제되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

// 채팅방 삭제
    deleteRoom: async (req, res, next) => {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;

            await chatService.deleteChatRoom(roomId, userId);

            return res.status(200).json({
                success: true,
                message: '채팅방이 삭제되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    }
};

module.exports = chatController;