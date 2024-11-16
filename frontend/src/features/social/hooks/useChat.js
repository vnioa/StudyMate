// features/social/hooks/useChat.js
import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { chatService } from '../services/chatService';
import {
    setChatData,
    setLoading,
    setError,
    setRefreshing,
    addChat,
    updateChat,
    removeChat,
    updateMessage,
    addMessage,
    removeMessage,
    setMessages,
    setTyping,
    markAsRead,
    updateParticipants,
    resetChatState,
    // 선택자
    selectChatRooms,
    selectUnreadCounts,
    selectPinnedChats,
    selectChatLoading,
    selectChatError,
    selectIsRefreshing,
    selectMessages,
    selectMessagePagination,
    selectParticipants,
    selectParticipantsLastUpdated,
    selectTypingUsers,
    selectLastRead,
    selectLastUpdated,
} from '../store/slices/chatSlice';

export const useChat = () => {
    const dispatch = useDispatch();

    // 선택자를 사용하여 상태 조회
    const chatRooms = useSelector(selectChatRooms);
    const unreadCounts = useSelector(selectUnreadCounts);
    const pinnedChats = useSelector(selectPinnedChats);
    const loading = useSelector(selectChatLoading);
    const error = useSelector(selectChatError);
    const isRefreshing = useSelector(selectIsRefreshing);
    const lastUpdated = useSelector(selectLastUpdated);
    const { data } = useSelector(state => state.chat);

    // 특정 채팅방의 메시지와 참가자 정보를 가져오는 함수
    const getChatRoomData = useCallback((chatId) => {
        const messages = useSelector(state => selectMessages(chatId)(state));
        const pagination = useSelector(state => selectMessagePagination(chatId)(state));
        const participants = useSelector(state => selectParticipants(chatId)(state));
        const participantsLastUpdated = useSelector(state => selectParticipantsLastUpdated(chatId)(state));
        const typingUsers = useSelector(state => selectTypingUsers(chatId)(state));
        const lastRead = useSelector(state => selectLastRead(chatId)(state));

        return {
            messages,
            pagination,
            participants,
            participantsLastUpdated,
            typingUsers,
            lastRead
        };
    }, []);

    // 채팅 데이터 가져오기
    const fetchChatData = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) {
                dispatch(setLoading(true));
            }

            const [chatRooms, unreadCounts, pinnedChats] = await Promise.all([
                chatService.getChatRooms(),
                chatService.getUnreadCounts(),
                chatService.getPinnedChats()
            ]);

            dispatch(setChatData({
                chatRooms,
                unreadCounts,
                pinnedChats,
                lastUpdated: new Date().toISOString()
            }));
            dispatch(setError(null));

        } catch (err) {
            dispatch(setError(err.message || '채팅 데이터를 불러오는데 실패했습니다.'));
            console.error('Chat Data Fetch Error:', err);
        } finally {
            if (showLoading) {
                dispatch(setLoading(false));
            }
        }
    }, [dispatch]);

    // 데이터가 오래되었는지 확인하는 함수
    const isDataStale = useCallback(() => {
        if (!lastUpdated) return true;

        const lastUpdate = new Date(lastUpdated);
        const now = new Date();
        const diffInMinutes = (now - lastUpdate) / (1000 * 60);

        return diffInMinutes > 5; // 5분 이상 지났으면 오래된 데이터로 간주
    }, [lastUpdated]);

    // 자동 새로고침 로직에 lastUpdated 활용
    useEffect(() => {
        if (isDataStale()) {
            fetchChatData(false);
        }
    }, [isDataStale, fetchChatData]);

    // 새로고침
    const refresh = useCallback(async () => {
        dispatch(setRefreshing(true));
        try {
            await fetchChatData(false);
        } finally {
            dispatch(setRefreshing(false));
        }
    }, [dispatch, fetchChatData]);

    // 채팅방 생성
    const createChatRoom = useCallback(async (chatData) => {
        try {
            const response = await chatService.createChatRoom(chatData);
            dispatch(addChat(response));
            return response;
        } catch (err) {
            console.error('Chat Room Creation Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 채팅방 업데이트
    const updateChatRoom = useCallback(async (chatId, updates) => {
        try {
            const response = await chatService.updateChatRoom(chatId, updates);
            dispatch(updateChat({ chatId, updates: response }));
            return response;
        } catch (err) {
            console.error('Chat Room Update Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 채팅방 삭제
    const deleteChatRoom = useCallback(async (chatId) => {
        try {
            await chatService.deleteChatRoom(chatId);
            dispatch(removeChat(chatId));
            return true;
        } catch (err) {
            console.error('Chat Room Deletion Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 메시지 전송
    const sendMessage = useCallback(async (chatId, messageData) => {
        try {
            const response = await chatService.sendMessage(chatId, messageData);
            dispatch(addMessage({ chatId, message: response }));
            return response;
        } catch (err) {
            console.error('Message Send Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 메시지 업데이트
    const updateMessageData = useCallback(async (chatId, messageId, updates) => {
        try {
            const response = await chatService.updateMessage(chatId, messageId, updates);
            dispatch(updateMessage({ chatId, messageId, updates: response }));
            return response;
        } catch (err) {
            console.error('Message Update Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 메시지 삭제
    const deleteMessage = useCallback(async (chatId, messageId) => {
        try {
            await chatService.deleteMessage(chatId, messageId);
            dispatch(removeMessage({ chatId, messageId }));
            return true;
        } catch (err) {
            console.error('Message Deletion Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 채팅방 고정/해제
    const togglePin = useCallback(async (chatId) => {
        try {
            const response = await chatService.togglePinChat(chatId);
            dispatch(updateChat({
                chatId,
                updates: { isPinned: response.isPinned }
            }));
            return response;
        } catch (err) {
            console.error('Pin Toggle Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 채팅방 알림 설정
    const toggleMute = useCallback(async (chatId) => {
        try {
            const response = await chatService.toggleMuteChat(chatId);
            dispatch(updateChat({
                chatId,
                updates: { isMuted: response.isMuted }
            }));
            return response;
        } catch (err) {
            console.error('Mute Toggle Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 메시지 목록 조회
    const getMessages = useCallback(async (chatId, params = {}) => {
        try {
            const response = await chatService.getMessages(chatId, params);
            dispatch(setMessages({
                chatId,
                messages: response.messages,
                pagination: response.pagination
            }));
            return response;
        } catch (err) {
            console.error('Messages Fetch Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 파일 업로드
    const uploadFile = useCallback(async (chatId, file, onProgress) => {
        try {
            const response = await chatService.uploadFile(chatId, file, {
                onUploadProgress: (progressEvent) => {
                    if (onProgress) {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        onProgress(percentCompleted);
                    }
                }
            });

            dispatch(addMessage({
                chatId,
                message: {
                    id: response.id,
                    type: 'file',
                    content: response.url,
                    fileName: response.fileName,
                    fileSize: response.fileSize,
                    mimeType: response.mimeType,
                    senderId: response.senderId,
                    createdAt: new Date().toISOString()
                }
            }));

            return response;
        } catch (err) {
            console.error('File Upload Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 참가자 목록 업데이트
    const updateParticipantList = useCallback(async (chatId, updates) => {
        try {
            const response = await chatService.updateParticipants(chatId, updates);
            dispatch(updateParticipants({
                chatId,
                participants: response.participants,
                updatedAt: new Date().toISOString()
            }));

            // 시스템 메시지 추가
            dispatch(addMessage({
                chatId,
                message: {
                    id: Date.now().toString(),
                    type: 'system',
                    content: updates.action === 'add' ? '새로운 참가자가 추가되었습니다.' : '참가자가 나갔습니다.',
                    createdAt: new Date().toISOString()
                }
            }));

            return response;
        } catch (err) {
            console.error('Participants Update Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 타이핑 상태 설정
    const handleTypingStatus = useCallback((chatId, userId, isTyping) => {
        dispatch(setTyping({
            chatId,
            userId,
            isTyping
        }));

        if (isTyping) {
            setTimeout(() => {
                dispatch(setTyping({
                    chatId,
                    userId,
                    isTyping: false
                }));
            }, 3000);
        }
    }, [dispatch]);

    // 메시지 읽음 처리
    const handleMarkAsRead = useCallback(async (chatId, messageId) => {
        try {
            const response = await chatService.markMessageAsRead(chatId, messageId);
            dispatch(markAsRead({
                chatId,
                messageId
            }));

            dispatch(updateChat({
                chatId,
                updates: {
                    unreadCount: response.unreadCount,
                    lastReadAt: new Date().toISOString()
                }
            }));

            return response;
        } catch (err) {
            console.error('Mark as Read Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 초기 데이터 로드
    useEffect(() => {
        fetchChatData();
        return () => {
            dispatch(resetChatState());
        };
    }, [dispatch, fetchChatData]);

    // 주기적인 데이터 갱신 (30초마다)
    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchChatData(false);
        }, 30 * 1000);

        return () => clearInterval(intervalId);
    }, [fetchChatData]);

    return {
        // 데이터
        chatRooms,
        unreadCounts,
        pinnedChats,
        messages: data.messages || {},
        participants: data.participants || {},
        lastUpdated: data.lastUpdated,
        typingUsers: data.typing || {},
        getChatRoomData: getChatRoomData,

        // 상태
        loading,
        error,
        isRefreshing,

        // 액션
        refresh,
        createChatRoom,
        updateChatRoom,
        deleteChatRoom,
        sendMessage,
        updateMessage: updateMessageData,
        deleteMessage,
        togglePin,
        toggleMute,
        getMessages,
        uploadFile,
        updateParticipants: updateParticipantList,
        setTypingStatus: handleTypingStatus,
        markAsRead: handleMarkAsRead,
        markAllAsRead: handleMarkAsRead,

        // 선택자 함수들도 외부로 노출
        selectors: {
            selectMessages,
            selectMessagePagination,
            selectParticipants,
            selectParticipantsLastUpdated,
            selectTypingUsers,
            selectLastRead,
            selectLastUpdated
        }
    };
};

export default useChat;