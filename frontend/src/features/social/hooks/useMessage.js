// features/social/hooks/useMessage.js
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    sendMessage,
    deleteMessage,
    editMessage,
    fetchMessages,
    markAsRead,
    setMessages,
    selectMessages,
    selectMessageLoading,
    selectMessageError
} from '../store/slices/messageSlice';
import { messageService } from '../services/messageService';
import { useSocket } from './useSocket';

export const useMessage = (chatId) => {
    const dispatch = useDispatch();
    const { socket, emitEvent } = useSocket();

    // 메시지 상태 조회
    const messages = useSelector((state) => selectMessages(chatId)(state));
    const loading = useSelector(selectMessageLoading);
    const error = useSelector(selectMessageError);

    // 메시지 목록 조회
    const loadMessages = useCallback(async (options = {}) => {
        try {
            const response = await dispatch(fetchMessages({ chatId, ...options })).unwrap();
            return response;
        } catch (err) {
            console.error('Message Load Error:', err);
            throw err;
        }
    }, [dispatch, chatId]);

    // 메시지 전송
    const handleSendMessage = useCallback(async (content, type = 'text') => {
        try {
            const message = {
                chatId,
                content,
                type,
                timestamp: new Date().toISOString()
            };

            // 소켓 이벤트 발신
            emitEvent('message:send', message);

            // Redux 액션 디스패치
            const response = await dispatch(sendMessage(message)).unwrap();
            return response;
        } catch (err) {
            console.error('Message Send Error:', err);
            throw err;
        }
    }, [dispatch, chatId, emitEvent]);

    // 메시지 수정
    const handleEditMessage = useCallback(async (messageId, content) => {
        try {
            const updates = {
                messageId,
                content,
                editedAt: new Date().toISOString()
            };

            // 소켓 이벤트 발신
            emitEvent('message:edit', { chatId, ...updates });

            // Redux 액션 디스패치
            const response = await dispatch(editMessage({ chatId, ...updates })).unwrap();
            return response;
        } catch (err) {
            console.error('Message Edit Error:', err);
            throw err;
        }
    }, [dispatch, chatId, emitEvent]);

    // 메시지 삭제
    const handleDeleteMessage = useCallback(async (messageId) => {
        try {
            // 소켓 이벤트 발신
            emitEvent('message:delete', { chatId, messageId });

            // Redux 액션 디스패치
            await dispatch(deleteMessage({ chatId, messageId })).unwrap();
            return true;
        } catch (err) {
            console.error('Message Delete Error:', err);
            throw err;
        }
    }, [dispatch, chatId, emitEvent]);

    // 메시지 읽음 처리
    const handleMarkAsRead = useCallback(async (messageId) => {
        try {
            // 소켓 이벤트 발신
            emitEvent('message:read', { chatId, messageId });

            // Redux 액션 디스패치
            await dispatch(markAsRead({ chatId, messageId })).unwrap();
            return true;
        } catch (err) {
            console.error('Message Read Error:', err);
            throw err;
        }
    }, [dispatch, chatId, emitEvent]);

    // 소켓 이벤트 리스너 설정
    useEffect(() => {
        if (!socket) return;

        // 새 메시지 수신
        const handleNewMessage = (message) => {
            if (message.chatId === chatId) {
                dispatch(setMessages({
                    chatId,
                    messages: [...messages, message]
                }));
            }
        };

        // 메시지 수정 수신
        const handleMessageEdit = (update) => {
            if (update.chatId === chatId) {
                const updatedMessages = messages.map(msg =>
                    msg.id === update.messageId
                        ? { ...msg, ...update }
                        : msg
                );
                dispatch(setMessages({ chatId, messages: updatedMessages }));
            }
        };

        // 메시지 삭제 수신
        const handleMessageDelete = ({ chatId: roomId, messageId }) => {
            if (roomId === chatId) {
                const updatedMessages = messages.filter(msg => msg.id !== messageId);
                dispatch(setMessages({ chatId, messages: updatedMessages }));
            }
        };

        // 이벤트 리스너 등록
        socket.on('message:new', handleNewMessage);
        socket.on('message:edited', handleMessageEdit);
        socket.on('message:deleted', handleMessageDelete);

        // 클린업
        return () => {
            socket.off('message:new', handleNewMessage);
            socket.off('message:edited', handleMessageEdit);
            socket.off('message:deleted', handleMessageDelete);
        };
    }, [socket, chatId, messages, dispatch]);

    return {
        messages,
        loading,
        error,
        loadMessages,
        sendMessage: handleSendMessage,
        editMessage: handleEditMessage,
        deleteMessage: handleDeleteMessage,
        markAsRead: handleMarkAsRead
    };
};

export default useMessage;