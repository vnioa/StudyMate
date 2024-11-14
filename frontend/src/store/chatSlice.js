// store/chatSlice.js

import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {
    fetchMessages,
    fetchScheduledMessages,
    scheduleMessage,
    sendMessage,
    uploadFile,
    fetchAttachments
} from '../api/chat';

const initialState = {
    messages: [],
    scheduledMessages: [],
    attachments: [],
    loading: false,
    error: null,
}

// Thunks for async actions
export const loadMessages = createAsyncThunk(
    'chat/loadMessages',
    async (chatId, { rejectWithValue }) => {
        try {
            return await fetchMessages(chatId);
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const sendChatMessage = createAsyncThunk(
    'chat/sendChatMessage',
    async ({ chatId, message }, { rejectWithValue }) => {
        try {
            return await sendMessage(chatId, message);
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const loadScheduledMessages = createAsyncThunk(
    'chat/loadScheduledMessages',
    async (chatId, { rejectWithValue }) => {
        try {
            return await fetchScheduledMessages(chatId);
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const scheduleChatMessage = createAsyncThunk(
    'chat/scheduleChatMessage',
    async ({ chatId, scheduledMessage }, { rejectWithValue }) => {
        try {
            return await scheduleMessage(chatId, scheduledMessage);
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// 파일 업로드
export const uploadFile = createAsyncThunk(
    'chat/uploadFile',
    async ({ chatId, file }, { rejectWithValue }) => {
        try {
            return await uploadFile({chatId, file});
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// 첨부 파일 불러오기
export const fetchAttachments = createAsyncThunk(
    'chat/fetchAttachments',
    async (chatId, { rejectWithValue }) => {
        try {
            return await fetchAttachments(chatId);
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        messages: [],
        scheduledMessages: [],
        loading: false,
        error: null,
    },
    reducers: {
        clearMessages: (state) => {
            state.messages = [];
        },
        clearScheduledMessages: (state) => {
            state.scheduledMessages = [];
        },
    },
    extraReducers: (builder) => {
        builder
            // Load Messages
            .addCase(loadMessages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loadMessages.fulfilled, (state, action) => {
                state.loading = false;
                state.messages = action.payload;
            })
            .addCase(loadMessages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Send Message
            .addCase(sendChatMessage.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(sendChatMessage.fulfilled, (state, action) => {
                state.loading = false;
                state.messages.unshift(action.payload); // Add the new message to the start of the list
            })
            .addCase(sendChatMessage.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Load Scheduled Messages
            .addCase(loadScheduledMessages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loadScheduledMessages.fulfilled, (state, action) => {
                state.loading = false;
                state.scheduledMessages = action.payload;
            })
            .addCase(loadScheduledMessages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Schedule Message
            .addCase(scheduleChatMessage.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(scheduleChatMessage.fulfilled, (state, action) => {
                state.loading = false;
                state.scheduledMessages.unshift(action.payload); // Add the scheduled message to the list
            })
            .addCase(scheduleChatMessage.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(uploadFile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(uploadFile.fulfilled, (state, action) => {
                state.loading = false;
                state.attachments.push(action.payload);
            })
            .addCase(uploadFile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchAttachments.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAttachments.fulfilled, (state, action) => {
                state.loading = false;
                state.attachments = action.payload;
            })
            .addCase(fetchAttachments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearMessages, clearScheduledMessages } = chatSlice.actions;

export default chatSlice.reducer;
