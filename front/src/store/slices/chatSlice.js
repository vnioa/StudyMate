import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    chatRooms: [],
    currentRoom: null,
    messages: [],
    loading: false,
    error: null,
    unreadCount: 0,
    pinnedRooms: []
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        // 채팅방 목록 관련
        setChatRooms: (state, action) => {
            state.chatRooms = action.payload;
        },
        addChatRoom: (state, action) => {
            state.chatRooms.unshift(action.payload);
        },
        updateChatRoom: (state, action) => {
            const index = state.chatRooms.findIndex(room => room.id === action.payload.id);
            if (index !== -1) {
                state.chatRooms[index] = action.payload;
            }
        },
        deleteChatRoom: (state, action) => {
            state.chatRooms = state.chatRooms.filter(room => room.id !== action.payload);
        },

        // 현재 채팅방 관련
        setCurrentRoom: (state, action) => {
            state.currentRoom = action.payload;
        },
        clearCurrentRoom: (state) => {
            state.currentRoom = null;
            state.messages = [];
        },

        // 메시지 관련
        setMessages: (state, action) => {
            state.messages = action.payload;
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload);
            // 현재 채팅방의 마지막 메시지 업데이트
            if (state.currentRoom?.id === action.payload.roomId) {
                const roomIndex = state.chatRooms.findIndex(room => room.id === action.payload.roomId);
                if (roomIndex !== -1) {
                    state.chatRooms[roomIndex].lastMessage = action.payload;
                }
            }
        },
        updateMessage: (state, action) => {
            const index = state.messages.findIndex(msg => msg.id === action.payload.id);
            if (index !== -1) {
                state.messages[index] = action.payload;
            }
        },
        deleteMessage: (state, action) => {
            state.messages = state.messages.filter(msg => msg.id !== action.payload);
        },

        // 읽음 상태 관련
        markAsRead: (state, action) => {
            const { roomId } = action.payload;
            const roomIndex = state.chatRooms.findIndex(room => room.id === roomId);
            if (roomIndex !== -1) {
                state.chatRooms[roomIndex].unreadCount = 0;
            }
        },
        incrementUnread: (state, action) => {
            const { roomId } = action.payload;
            const roomIndex = state.chatRooms.findIndex(room => room.id === roomId);
            if (roomIndex !== -1) {
                state.chatRooms[roomIndex].unreadCount += 1;
            }
        },

        // 채팅방 고정 관련
        togglePinRoom: (state, action) => {
            const roomIndex = state.chatRooms.findIndex(room => room.id === action.payload);
            if (roomIndex !== -1) {
                state.chatRooms[roomIndex].isPinned = !state.chatRooms[roomIndex].isPinned;
                // 고정된 채팅방 순서 재정렬
                state.chatRooms.sort((a, b) => {
                    if (a.isPinned === b.isPinned) {
                        return new Date(b.updatedAt) - new Date(a.updatedAt);
                    }
                    return b.isPinned ? 1 : -1;
                });
            }
        },

        // 로딩 및 에러 상태 관리
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        }
    }
});

export const {
    setChatRooms,
    addChatRoom,
    updateChatRoom,
    deleteChatRoom,
    setCurrentRoom,
    clearCurrentRoom,
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    markAsRead,
    incrementUnread,
    togglePinRoom,
    setLoading,
    setError,
    clearError
} = chatSlice.actions;

export default chatSlice.reducer;