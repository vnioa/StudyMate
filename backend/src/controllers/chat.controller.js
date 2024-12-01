const chatService = require('../services/chat.service');

const chatController = {
    // 읽지 않은 메시지 수 조회
    getUnreadCount: async (req, res) => {
        try {
            const result = await chatService.getUnreadCount();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 채팅방 생성
    createChatRoom: async (req, res) => {
        try {
            const result = await chatService.createChatRoom(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 채팅방 목록 조회
    getChatRooms: async (req, res) => {
        try {
            const result = await chatService.getChatRooms(req.query);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 채팅방 검색
    searchRooms: async (req, res) => {
        try {
            const result = await chatService.searchRooms(req.query.query);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 채팅방 상세 조회
    getChatRoom: async (req, res) => {
        try {
            const result = await chatService.getChatRoom(req.params.roomId);
            res.json(result);
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    },

    // 채팅방 상세 정보 조회
    getRoomDetail: async (req, res) => {
        try {
            const result = await chatService.getRoomDetail(req.params.roomId);
            res.json(result);
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    },

    // 채팅방 설정 업데이트
    updateRoomSettings: async (req, res) => {
        try {
            const result = await chatService.updateRoomSettings(req.params.roomId, req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 채팅방 이름 변경
    updateRoomName: async (req, res) => {
        try {
            const result = await chatService.updateRoomName(req.params.roomId, req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 채팅방 참여자 관리
    updateParticipants: async (req, res) => {
        try {
            const result = await chatService.updateParticipants(req.params.roomId, req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 채팅방 고정/고정해제
    pinChatRoom: async (req, res) => {
        try {
            const result = await chatService.pinChatRoom(req.params.roomId, req.body.isPinned);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 채팅방 삭제
    deleteRoom: async (req, res) => {
        try {
            const result = await chatService.deleteRoom(req.params.roomId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 메시지 전송
    sendMessage: async (req, res) => {
        try {
            const result = await chatService.sendMessage(req.params.roomId, req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 이미지 메시지 전송
    sendImageMessage: async (req, res) => {
        try {
            const result = await chatService.sendImageMessage(req.params.roomId, req.file);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 메시지 읽음 처리
    markAsRead: async (req, res) => {
        try {
            const result = await chatService.markAsRead(req.params.roomId, req.params.messageId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 메시지 중요 표시 토글
    toggleImportant: async (req, res) => {
        try {
            const result = await chatService.toggleImportant(req.params.messageId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 채팅방 나가기
    leaveRoom: async (req, res) => {
        try {
            const result = await chatService.leaveRoom(req.params.roomId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = chatController;