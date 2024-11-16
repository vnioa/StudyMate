// features/social/hooks/useSocket.js
import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import io from 'socket.io-client';
import {BASE_URL} from '../../../constants/apiEndpoints'
import { selectUserId } from '../../auth/Login/store/slices/authSlice';
import {
    setOnlineUsers,
    setTypingUsers,
    updateChatLastMessage
} from '../store/slices/chatSlice';
import { addMessage, updateMessage, deleteMessage } from '../store/slices/messageSlice';

export const useSocket = () => {
    const dispatch = useDispatch();
    const socketRef = useRef(null);
    const userId = useSelector(selectUserId);

    // 소켓 초기화
    const initializeSocket = useCallback(() => {
        if (!userId) return;

        socketRef.current = io(BASE_URL, {
            query: { userId },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        // 연결 이벤트 처리
        socketRef.current.on('connect', () => {
            console.log('Socket connected');
        });

        // 연결 해제 이벤트 처리
        socketRef.current.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        // 재연결 이벤트 처리
        socketRef.current.on('reconnect', (attemptNumber) => {
            console.log(`Socket reconnected after ${attemptNumber} attempts`);
        });

        // 에러 이벤트 처리
        socketRef.current.on('error', (error) => {
            console.error('Socket error:', error);
        });

        // 온라인 사용자 업데이트
        socketRef.current.on('users:online', (users) => {
            dispatch(setOnlineUsers(users));
        });

        // 타이핑 상태 업데이트
        socketRef.current.on('chat:typing', ({ chatId, userId, isTyping }) => {
            dispatch(setTypingUsers({ chatId, userId, isTyping }));
        });

        // 새 메시지 수신
        socketRef.current.on('message:receive', (message) => {
            dispatch(addMessage(message));
            dispatch(updateChatLastMessage({
                chatId: message.chatId,
                lastMessage: message
            }));
        });

        // 메시지 수정 수신
        socketRef.current.on('message:updated', (update) => {
            dispatch(updateMessage(update));
        });

        // 메시지 삭제 수신
        socketRef.current.on('message:deleted', ({ chatId, messageId }) => {
            dispatch(deleteMessage({ chatId, messageId }));
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [dispatch, userId]);

    // 이벤트 발신
    const emitEvent = useCallback((event, data) => {
        if (socketRef.current) {
            socketRef.current.emit(event, data);
        }
    }, []);

    // 타이핑 상태 전송
    const sendTypingStatus = useCallback((chatId, isTyping) => {
        emitEvent('chat:typing', { chatId, isTyping });
    }, [emitEvent]);

    // 온라인 상태 업데이트
    const updateOnlineStatus = useCallback((status) => {
        emitEvent('user:status', { status });
    }, [emitEvent]);

    // 채팅방 입장
    const joinChat = useCallback((chatId) => {
        emitEvent('chat:join', { chatId });
    }, [emitEvent]);

    // 채팅방 퇴장
    const leaveChat = useCallback((chatId) => {
        emitEvent('chat:leave', { chatId });
    }, [emitEvent]);

    // 컴포넌트 마운트 시 소켓 초기화
    useEffect(() => {
        const cleanup = initializeSocket();
        return () => {
            cleanup?.();
        };
    }, [initializeSocket]);

    return {
        socket: socketRef.current,
        emitEvent,
        sendTypingStatus,
        updateOnlineStatus,
        joinChat,
        leaveChat,
        initializeSocket
    };
};

export default useSocket;