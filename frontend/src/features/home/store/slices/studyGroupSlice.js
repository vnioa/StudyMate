// features/home/store/slices/studyGroupSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { studyGroupService } from '../../services/studyGroupService';

// Async Thunk Actions
export const fetchStudyGroupData = createAsyncThunk(
    'studyGroup/fetchStudyGroupData',
    async (_, { rejectWithValue }) => {
        try {
            const [groups, communityPosts, notifications, statistics] = await Promise.all([
                studyGroupService.getGroups(),
                studyGroupService.getCommunityFeed(),
                studyGroupService.getGroupNotifications(),
                studyGroupService.getGroupStatistics()
            ]);

            return {
                groups,
                communityPosts,
                notifications,
                statistics,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    data: {
        groups: [],              // 스터디 그룹 목록
        communityPosts: [],      // 커뮤니티 게시글
        notifications: [],       // 그룹 알림
        statistics: {           // 그룹 통계
            totalGroups: 0,       // 전체 그룹 수
            activeGroups: 0,      // 활성 그룹 수
            totalMembers: 0,      // 전체 멤버 수
            completedGoals: 0     // 완료된 목표 수
        },
        lastUpdated: null      // 마지막 업데이트 시간
    },
    loading: false,
    error: null,
    isRefreshing: false
};

const studyGroupSlice = createSlice({
    name: 'studyGroup',
    initialState,
    reducers: {
        setStudyGroupData: (state, action) => {
            state.data = {
                ...state.data,
                ...action.payload,
                lastUpdated: new Date().toISOString()
            };
            state.error = null;
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

        updateGroup: (state, action) => {
            const { groupId, updates } = action.payload;
            const groupIndex = state.data.groups.findIndex(group => group.id === groupId);
            if (groupIndex !== -1) {
                state.data.groups[groupIndex] = {
                    ...state.data.groups[groupIndex],
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
            }
        },

        addPost: (state, action) => {
            state.data.communityPosts.unshift({
                ...action.payload,
                createdAt: new Date().toISOString()
            });
        },

        removePost: (state, action) => {
            state.data.communityPosts = state.data.communityPosts.filter(
                post => post.id !== action.payload
            );
        },

        updateNotification: (state, action) => {
            const { notificationId, updates } = action.payload;
            const notificationIndex = state.data.notifications.findIndex(
                notification => notification.id === notificationId
            );
            if (notificationIndex !== -1) {
                state.data.notifications[notificationIndex] = {
                    ...state.data.notifications[notificationIndex],
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
            }
        },

        resetStudyGroupState: () => initialState
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchStudyGroupData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStudyGroupData.fulfilled, (state, action) => {
                state.loading = false;
                state.data = {
                    ...state.data,
                    ...action.payload
                };
                state.error = null;
            })
            .addCase(fetchStudyGroupData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || '데이터를 불러오는데 실패했습니다.';
            });
    }
});

// 액션 생성자 내보내기
export const {
    setStudyGroupData,
    setLoading,
    setError,
    setRefreshing,
    updateGroup,
    addPost,
    removePost,
    updateNotification,
    resetStudyGroupState
} = studyGroupSlice.actions;

// 선택자 함수들
export const selectStudyGroupData = (state) => state.studyGroup.data;
export const selectStudyGroupLoading = (state) => state.studyGroup.loading;
export const selectStudyGroupError = (state) => state.studyGroup.error;
export const selectIsRefreshing = (state) => state.studyGroup.isRefreshing;
export const selectGroups = (state) => state.studyGroup.data.groups;
export const selectCommunityPosts = (state) => state.studyGroup.data.communityPosts;
export const selectNotifications = (state) => state.studyGroup.data.notifications;
export const selectStatistics = (state) => state.studyGroup.data.statistics;
export const selectLastUpdated = (state) => state.studyGroup.data.lastUpdated;

export default studyGroupSlice.reducer;