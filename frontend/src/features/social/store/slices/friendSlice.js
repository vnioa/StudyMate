// features/social/store/slices/friendSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { friendService } from '../../services/friendService';

// Async Thunk Actions
export const fetchFriends = createAsyncThunk(
    'friend/fetchFriends',
    async (_, { rejectWithValue }) => {
        try {
            const [friends, blocked] = await Promise.all([
                friendService.getFriends(),
                friendService.getBlockedUsers()
            ]);
            return { friends, blocked };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const searchFriends = createAsyncThunk(
    'friend/searchFriends',
    async (query, { rejectWithValue }) => {
        try {
            const results = await friendService.searchFriends(query);
            return results;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const addFriend = createAsyncThunk(
    'friend/addFriend',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await friendService.addFriend(userId);
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const removeFriend = createAsyncThunk(
    'friend/removeFriend',
    async (friendId, { rejectWithValue }) => {
        try {
            await friendService.removeFriend(friendId);
            return friendId;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const blockFriend = createAsyncThunk(
    'friend/blockFriend',
    async (friendId, { rejectWithValue }) => {
        try {
            const response = await friendService.blockUser(friendId);
            return { userId: friendId, ...response };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const unblockFriend = createAsyncThunk(
    'friend/unblockFriend',
    async (userId, { rejectWithValue }) => {
        try {
            await friendService.unblockUser(userId);
            return userId;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    data: {
        friends: [],
        blocked: [],
        searchResults: [],
        suggestions: [],
        lastUpdated: null
    },
    loading: false,
    error: null,
    isRefreshing: false,
    searchLoading: false,
    searchError: null
};

const friendSlice = createSlice({
    name: 'friend',
    initialState,
    reducers: {
        setFriends: (state, action) => {
            state.data.friends = action.payload;
            state.data.lastUpdated = new Date().toISOString();
        },
        setSearchResults: (state, action) => {
            state.data.searchResults = action.payload;
            state.searchLoading = false;
            state.searchError = null;
        },
        clearSearchResults: (state) => {
            state.data.searchResults = [];
            state.searchLoading = false;
            state.searchError = null;
        },
        setSuggestions: (state, action) => {
            state.data.suggestions = action.payload;
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
        resetFriendState: () => initialState
    },
    extraReducers: (builder) => {
        builder
            // fetchFriends
            .addCase(fetchFriends.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFriends.fulfilled, (state, action) => {
                state.loading = false;
                state.data.friends = action.payload.friends;
                state.data.blocked = action.payload.blocked;
                state.data.lastUpdated = new Date().toISOString();
                state.error = null;
            })
            .addCase(fetchFriends.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || '친구 목록을 불러오는데 실패했습니다.';
            })
            // searchFriends
            .addCase(searchFriends.pending, (state) => {
                state.searchLoading = true;
                state.searchError = null;
            })
            .addCase(searchFriends.fulfilled, (state, action) => {
                state.searchLoading = false;
                state.data.searchResults = action.payload;
                state.searchError = null;
            })
            .addCase(searchFriends.rejected, (state, action) => {
                state.searchLoading = false;
                state.searchError = action.payload || '친구 검색에 실패했습니다.';
            })
            // addFriend
            .addCase(addFriend.fulfilled, (state, action) => {
                state.data.friends.push(action.payload);
                state.data.searchResults = state.data.searchResults.filter(
                    user => user.id !== action.payload.id
                );
                state.data.lastUpdated = new Date().toISOString();
            })
            // removeFriend
            .addCase(removeFriend.fulfilled, (state, action) => {
                state.data.friends = state.data.friends.filter(
                    friend => friend.id !== action.payload
                );
                state.data.lastUpdated = new Date().toISOString();
            })
            // blockFriend
            .addCase(blockFriend.fulfilled, (state, action) => {
                state.data.friends = state.data.friends.filter(
                    friend => friend.id !== action.payload.userId
                );
                state.data.blocked.push(action.payload);
                state.data.lastUpdated = new Date().toISOString();
            })
            // unblockFriend
            .addCase(unblockFriend.fulfilled, (state, action) => {
                state.data.blocked = state.data.blocked.filter(
                    user => user.id !== action.payload
                );
                state.data.lastUpdated = new Date().toISOString();
            });
    }
});

// 액션 생성자 내보내기
export const {
    setFriends,
    setSearchResults,
    clearSearchResults,
    setSuggestions,
    setLoading,
    setError,
    setRefreshing,
    resetFriendState
} = friendSlice.actions;

// 선택자 함수들
export const selectFriendState = (state) => state.friend;
export const selectFriends = (state) => selectFriendState(state).data.friends;
export const selectBlocked = (state) => selectFriendState(state).data.blocked;
export const selectSearchResults = (state) => selectFriendState(state).data.searchResults;
export const selectSuggestions = (state) => selectFriendState(state).data.suggestions;
export const selectLoading = (state) => selectFriendState(state).loading;
export const selectError = (state) => selectFriendState(state).error;
export const selectIsRefreshing = (state) => selectFriendState(state).isRefreshing;
export const selectSearchLoading = (state) => selectFriendState(state).searchLoading;
export const selectSearchError = (state) => selectFriendState(state).searchError;
export const selectLastUpdated = (state) => selectFriendState(state).data.lastUpdated;

export default friendSlice.reducer;