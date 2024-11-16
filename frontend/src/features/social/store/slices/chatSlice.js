// features/social/store/slices/chatSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { chatService } from '../../services/chatService';

// Async Thunk Actions
export const fetchChatData = createAsyncThunk(
    'chat/fetchChatData',
    async (_, { rejectWithValue }) => {
        try {
            const [chatRooms, unreadCounts, pinnedChats] = await Promise.all([
                chatService.getChatRooms(),
                chatService.getUnreadCounts(),
                chatService.getPinnedChats()
            ]);

            return {
                chatRooms,
                unreadCounts,
                pinnedChats,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    data: {
        chatRooms: [],           // 채팅방 목록
        messages: {},            // 채팅방별 메시지
        unreadCounts: {},        // 읽지 않은 메시지 수
        pinnedChats: [],         // 고정된 채팅방
        mutedChats: [],          // 음소거된 채팅방
        participants: {},        // 채팅방 참가자
        typing: {},              // 입력 중인 사용자
        lastRead: {},           // 마지막 읽은 메시지
        lastUpdated: null       // 마지막 업데이트 시간
    },
    loading: false,
    error: null,
    isRefreshing: false
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setChatData: (state, action) => {
            state.data = {
                ...state.data,
                ...action.payload,
                lastUpdated: new Date().toISOString()
            };
            state.error = null;
        },

        setMessages: (state, action) => {
            const { chatId, messages, pagination } = action.payload;
            if (!state.data.messages) {
                state.data.messages = {};
            }
            state.data.messages[chatId] = {
                items: messages,
                pagination,
                lastUpdated: new Date().toISOString()
            };
        },

        updateParticipants: (state, action) => {
            const { chatId, participants, updatedAt } = action.payload;
            if (!state.data.participants) {
                state.data.participants = {};
            }
            state.data.participants[chatId] = {
                list: participants,
                lastUpdated: updatedAt || new Date().toISOString()
            };

            // 채팅방 정보도 업데이트
            const chatIndex = state.data.chatRooms.findIndex(chat => chat.id === chatId);
            if (chatIndex !== -1) {
                state.data.chatRooms[chatIndex] = {
                    ...state.data.chatRooms[chatIndex],
                    participants,
                    participantsCount: participants.length,
                    updatedAt: updatedAt || new Date().toISOString()
                };
            }
        },

        setLoading: (state, action) => {
            state.loading = action.payload;
        },

        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },

        setRefreshing: (state, action) => {
            state.isRefreshing = action.payload;
        },

        addChat: (state, action) => {
            state.data.chatRooms.unshift(action.payload);
        },

        updateChat: (state, action) => {
            const { chatId, updates } = action.payload;
            const chatIndex = state.data.chatRooms.findIndex(chat => chat.id === chatId);
            if (chatIndex !== -1) {
                state.data.chatRooms[chatIndex] = {
                    ...state.data.chatRooms[chatIndex],
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
            }
        },

        removeChat: (state, action) => {
            state.data.chatRooms = state.data.chatRooms.filter(
                chat => chat.id !== action.payload
            );
            delete state.data.messages[action.payload];
            delete state.data.unreadCounts[action.payload];
        },

        addMessage: (state, action) => {
            const { chatId, message } = action.payload;
            if (!state.data.messages[chatId]) {
                state.data.messages[chatId] = {
                    items: []
                };
            }
            state.data.messages[chatId].items.push(message);

            // 읽지 않은 메시지 수 업데이트
            if (!state.data.unreadCounts[chatId]) {
                state.data.unreadCounts[chatId] = 0;
            }
            state.data.unreadCounts[chatId]++;
        },

        updateMessage: (state, action) => {
            const { chatId, messageId, updates } = action.payload;
            const messages = state.data.messages[chatId]?.items;
            if (messages) {
                const messageIndex = messages.findIndex(msg => msg.id === messageId);
                if (messageIndex !== -1) {
                    messages[messageIndex] = {
                        ...messages[messageIndex],
                        ...updates,
                        updatedAt: new Date().toISOString()
                    };
                }
            }
        },

        removeMessage: (state, action) => {
            const { chatId, messageId } = action.payload;
            if (state.data.messages[chatId]?.items) {
                state.data.messages[chatId].items = state.data.messages[chatId].items.filter(
                    msg => msg.id !== messageId
                );
            }
        },

        setTyping: (state, action) => {
            const { chatId, userId, isTyping } = action.payload;
            if (!state.data.typing[chatId]) {
                state.data.typing[chatId] = {};
            }
            if (isTyping) {
                state.data.typing[chatId][userId] = new Date().toISOString();
            } else {
                delete state.data.typing[chatId][userId];
            }
        },

        markAsRead: (state, action) => {
            const { chatId, messageId } = action.payload;
            state.data.lastRead[chatId] = messageId;
            state.data.unreadCounts[chatId] = 0;
        },

        resetChatState: () => initialState
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchChatData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchChatData.fulfilled, (state, action) => {
                state.loading = false;
                state.data = {
                    ...state.data,
                    ...action.payload
                };
                state.error = null;
            })
            .addCase(fetchChatData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || '데이터를 불러오는데 실패했습니다.';
            });
    }
});

// 액션 생성자 내보내기
export const {
    setChatData,
    setLoading,
    setError,
    setRefreshing,
    addChat,
    updateChat,
    removeChat,
    addMessage,
    updateMessage,
    removeMessage,
    setMessages,
    updateParticipants,
    setTyping,
    markAsRead,
    resetChatState
} = chatSlice.actions;

// 선택자 함수들
export const selectChatState = (state) => state.chat;
export const selectChatData = (state) => selectChatState(state).data;
export const selectChatLoading = (state) => selectChatState(state).loading;
export const selectChatError = (state) => selectChatState(state).error;
export const selectIsRefreshing = (state) => selectChatState(state).isRefreshing;

// 채팅방 관련 선택자
export const selectChatRooms = (state) => selectChatData(state).chatRooms || [];
export const selectPinnedChats = (state) => selectChatData(state).pinnedChats || [];
export const selectUnreadCounts = (state) => selectChatData(state).unreadCounts || {};

// 메시지 관련 선택자
export const selectMessages = (chatId) => (state) =>
    selectChatData(state).messages?.[chatId]?.items || [];
export const selectMessagePagination = (chatId) => (state) =>
    selectChatData(state).messages?.[chatId]?.pagination;

// 참가자 관련 선택자
export const selectParticipants = (chatId) => (state) =>
    selectChatData(state).participants?.[chatId]?.list || [];
export const selectParticipantsLastUpdated = (chatId) => (state) =>
    selectChatData(state).participants?.[chatId]?.lastUpdated;

// 상태 관련 선택자
export const selectTypingUsers = (chatId) => (state) =>
    selectChatData(state).typing?.[chatId] || {};
export const selectLastRead = (chatId) => (state) =>
    selectChatData(state).lastRead?.[chatId];
export const selectLastUpdated = (state) =>
    selectChatData(state).lastUpdated;

export default chatSlice.reducer;