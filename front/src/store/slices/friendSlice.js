import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    friends: [],
    pendingRequests: [],
    blockedUsers: [],
    loading: false,
    error: null
};

const friendSlice = createSlice({
    name: 'friend',
    initialState,
    reducers: {
        // 친구 목록 관련
        setFriends: (state, action) => {
            state.friends = action.payload;
        },
        addFriend: (state, action) => {
            state.friends.push(action.payload);
        },
        removeFriend: (state, action) => {
            state.friends = state.friends.filter(friend => friend.id !== action.payload);
        },

        // 친구 요청 관련
        setPendingRequests: (state, action) => {
            state.pendingRequests = action.payload;
        },
        addPendingRequest: (state, action) => {
            state.pendingRequests.push(action.payload);
        },
        removePendingRequest: (state, action) => {
            state.pendingRequests = state.pendingRequests.filter(
                request => request.id !== action.payload
            );
        },

        // 차단 사용자 관련
        setBlockedUsers: (state, action) => {
            state.blockedUsers = action.payload;
        },
        addBlockedUser: (state, action) => {
            state.blockedUsers.push(action.payload);
            // 차단 시 친구 목록에서 제거
            state.friends = state.friends.filter(friend => friend.id !== action.payload.id);
        },
        removeBlockedUser: (state, action) => {
            state.blockedUsers = state.blockedUsers.filter(
                user => user.id !== action.payload
            );
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
    setFriends,
    addFriend,
    removeFriend,
    setPendingRequests,
    addPendingRequest,
    removePendingRequest,
    setBlockedUsers,
    addBlockedUser,
    removeBlockedUser,
    setLoading,
    setError,
    clearError
} = friendSlice.actions;

export default friendSlice.reducer;