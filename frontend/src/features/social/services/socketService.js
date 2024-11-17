// features/social/services/socketService.js
import io from 'socket.io-client';
import { BASE_URL } from '../../../constants/apiEndpoints';

let socket = null;
const eventHandlers = new Map();
let activeRooms = new Set();

// 에러 핸들링 유틸리티
const handleError = (error) => {
    console.error('Socket Service Error:', error);
    // 필요한 경우 에러 리포팅 서비스로 전송
};

// 기본 이벤트 핸들러 설정
const setupDefaultHandlers = () => {
    if (!socket) return;

    socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        reconnectAllRooms();
    });

    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
};

export const socketService = {
    // 소켓 연결 초기화
    initialize: (userId, token) => {
        if (socket) return;

        socket = io(BASE_URL, {
            query: { userId },
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000
        });

        setupDefaultHandlers();
    },

    // 소켓 연결 해제
    disconnect: () => {
        if (socket) {
            socket.disconnect();
            socket = null;
            eventHandlers.clear();
            activeRooms.clear();
        }
    },

    // 이벤트 리스너 등록
    on: (event, handler) => {
        if (!socket) return;

        socket.on(event, handler);
        eventHandlers.set(event, handler);
    },

    // 이벤트 리스너 제거
    off: (event) => {
        if (!socket) return;

        const handler = eventHandlers.get(event);
        if (handler) {
            socket.off(event, handler);
            eventHandlers.delete(event);
        }
    },

    // 이벤트 발신
    emit: (event, data) => {
        if (!socket) return;

        socket.emit(event, data);
    },

    // 채팅방 입장
    joinRoom: (roomId) => {
        if (!socket) return;

        socket.emit('room:join', { roomId });
        activeRooms.add(roomId);
    },

    // 채팅방 퇴장
    leaveRoom: (roomId) => {
        if (!socket) return;

        socket.emit('room:leave', { roomId });
        activeRooms.delete(roomId);
    },

    // 모든 채팅방 재연결
    reconnectAllRooms: () => {
        if (!socket || activeRooms.size === 0) return;

        activeRooms.forEach(roomId => {
            socket.emit('room:join', { roomId });
        });
    },

    // 타이핑 상태 전송
    sendTypingStatus: (roomId, isTyping) => {
        if (!socket) return;

        socket.emit('chat:typing', { roomId, isTyping });
    },

    // 온라인 상태 업데이트
    updateOnlineStatus: (status) => {
        if (!socket) return;

        socket.emit('user:status', { status });
    },

    // 읽음 상태 업데이트
    markAsRead: (roomId, messageId) => {
        if (!socket) return;

        socket.emit('message:read', { roomId, messageId });
    },

    // 연결 상태 확인
    isConnected: () => {
        return socket?.connected || false;
    },

    // 재연결 시도
    reconnect: () => {
        if (socket) {
            socket.connect();
        }
    },

    // 소켓 ID 반환
    getSocketId: () => {
        return socket?.id;
    },

    // 활성 채팅방 목록 반환
    getActiveRooms: () => {
        return Array.from(activeRooms);
    }
};

export default socketService;