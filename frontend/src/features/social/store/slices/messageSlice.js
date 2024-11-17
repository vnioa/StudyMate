// features/social/store/slices/messageSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { messageService } from '../../services/messageService';

// Async Thunk Actions
export const fetchMessages = createAsyncThunk(
    'message/fetchMessages',
    async ({ chatId, options = {} }, { rejectWithValue }) => {
        try {
            const response = await messageService.getMessages(chatId, options);
            return { chatId, messages: response };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const sendMessage = createAsyncThunk(
    'message/sendMessage',
    async (message, { rejectWithValue }) => {
        try {
            const response = await messageService.sendMessage(message.chatId, message);
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const editMessage = createAsyncThunk(
    'message/editMessage',
    async ({ chatId, messageId, content }, { rejectWithValue }) => {
        try {
            const response = await messageService.editMessage(chatId, messageId, content);
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const deleteMessage = createAsyncThunk(
    'message/deleteMessage',
    async ({ chatId, messageId }, { rejectWithValue }) => {
        try {
            await messageService.deleteMessage(chatId, messageId);
            return { chatId, messageId };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    data: {
        messages: {},  // chatId를 키로 사용하는 객체
        pagination: {}, // 각 채팅방별 페이지네이션 정보
        lastRead: {},  // 각 채팅방별 마지막으로 읽은 메시지
        reactions: {}, // 메시지별 리액션 정보
        drafts: {},    // 임시 저장된 메시지
    },
    loading: false,
    error: null,
    currentChatId: null
};

const messageSlice = createSlice({
    name: 'message',
    initialState,
    reducers: {
        setMessages: (state, action) => {
            const { chatId, messages } = action.payload;
            state.data.messages[chatId] = messages;
        },
        addMessage: (state, action) => {
            const message = action.payload;
            const chatId = message.chatId;
            if (!state.data.messages[chatId]) {
                state.data.messages[chatId] = [];
            }
            state.data.messages[chatId].push(message);
        },
        updateMessage: (state, action) => {
            const { chatId, messageId, updates } = action.payload;
            const messages = state.data.messages[chatId];
            if (messages) {
                const index = messages.findIndex(msg => msg.id === messageId);
                if (index !== -1) {
                    messages[index] = { ...messages[index], ...updates };
                }
            }
        },
        removeMessage: (state, action) => {
            const { chatId, messageId } = action.payload;
            const messages = state.data.messages[chatId];
            if (messages) {
                state.data.messages[chatId] = messages.filter(
                    msg => msg.id !== messageId
                );
            }
        },
        setCurrentChat: (state, action) => {
            state.currentChatId = action.payload;
        },
        saveDraft: (state, action) => {
            const { chatId, content } = action.payload;
            state.data.drafts[chatId] = content;
        },
        clearDraft: (state, action) => {
            const chatId = action.payload;
            delete state.data.drafts[chatId];
        },
        addReaction: (state, action) => {
            const { chatId, messageId, reaction, userId } = action.payload;
            if (!state.data.reactions[messageId]) {
                state.data.reactions[messageId] = {};
            }
            if (!state.data.reactions[messageId][reaction]) {
                state.data.reactions[messageId][reaction] = [];
            }
            state.data.reactions[messageId][reaction].push(userId);
        },
        removeReaction: (state, action) => {
            const { messageId, reaction, userId } = action.payload;
            if (state.data.reactions[messageId]?.[reaction]) {
                state.data.reactions[messageId][reaction] =
                    state.data.reactions[messageId][reaction].filter(id => id !== userId);
            }
        },
        markAsRead: (state, action) => {
            const { chatId, messageId } = action.payload;
            state.data.lastRead[chatId] = messageId;
        },
        clearMessages: (state, action) => {
            const chatId = action.payload;
            delete state.data.messages[chatId];
            delete state.data.pagination[chatId];
        },
        resetMessageState: () => initialState
    },
    extraReducers: (builder) => {
        builder
            // fetchMessages
            .addCase(fetchMessages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                const { chatId, messages } = action.payload;
                state.loading = false;
                state.data.messages[chatId] = messages;
                state.error = null;
            })
            .addCase(fetchMessages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || '메시지를 불러오는데 실패했습니다.';
            })
            // sendMessage
            .addCase(sendMessage.fulfilled, (state, action) => {
                const message = action.payload;
                const chatId = message.chatId;
                if (!state.data.messages[chatId]) {
                    state.data.messages[chatId] = [];
                }
                state.data.messages[chatId].push(message);
            })
            // editMessage
            .addCase(editMessage.fulfilled, (state, action) => {
                const updatedMessage = action.payload;
                const chatId = updatedMessage.chatId;
                const messages = state.data.messages[chatId];
                if (messages) {
                    const index = messages.findIndex(msg => msg.id === updatedMessage.id);
                    if (index !== -1) {
                        messages[index] = updatedMessage;
                    }
                }
            })
            // deleteMessage
            .addCase(deleteMessage.fulfilled, (state, action) => {
                const { chatId, messageId } = action.payload;
                const messages = state.data.messages[chatId];
                if (messages) {
                    state.data.messages[chatId] = messages.filter(
                        msg => msg.id !== messageId
                    );
                }
            });
    }
});

// Actions
export const {
    setMessages,
    addMessage,
    updateMessage,
    removeMessage,
    setCurrentChat,
    saveDraft,
    clearDraft,
    addReaction,
    removeReaction,
    markAsRead,
    clearMessages,
    resetMessageState
} = messageSlice.actions;

// Selectors
export const selectMessages = (chatId) => (state) =>
    state.message.data.messages[chatId] || [];
export const selectMessageById = (chatId, messageId) => (state) =>
    state.message.data.messages[chatId]?.find(msg => msg.id === messageId);
export const selectDraft = (chatId) => (state) =>
    state.message.data.drafts[chatId];
export const selectReactions = (messageId) => (state) =>
    state.message.data.reactions[messageId] || {};
export const selectLastRead = (chatId) => (state) =>
    state.message.data.lastRead[chatId];
export const selectCurrentChatId = (state) =>
    state.message.currentChatId;
export const selectLoading = (state) =>
    state.message.loading;
export const selectError = (state) =>
    state.message.error;

export default messageSlice.reducer;