// features/home/store/slices/studyGroupSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { studyGroupService } from '../../services/studyGroupService';

// Async Thunk Actions
export const fetchStudyGroupData = createAsyncThunk(
    'studyGroup/fetchStudyGroupData',
    async (_, { rejectWithValue }) => {
        try {
            const [groups, posts, notifications, statistics] = await Promise.all([
                studyGroupService.getGroups(),
                studyGroupService.getCommunityFeed(),
                studyGroupService.getGroupNotifications(),
                studyGroupService.getGroupStatistics()
            ]);

            return {
                groups,
                communityPosts: posts,
                notifications,
                statistics,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// 그룹 생성 Thunk
export const createGroup = createAsyncThunk(
    'studyGroup/createGroup',
    async (groupData, { rejectWithValue }) => {
        try {
            const response = await studyGroupService.createGroup(groupData);
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// 게시글 생성 Thunk
export const createPost = createAsyncThunk(
    'studyGroup/createPost',
    async ({ groupId, postData }, { rejectWithValue }) => {
        try {
            const response = await studyGroupService.createPost(groupId, postData);
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    // ... 기존 initialState 유지
};

const studyGroupSlice = createSlice({
    name: 'studyGroup',
    initialState,
    reducers: {
        // ... 기존 reducers 유지
    },
    extraReducers: (builder) => {
        builder
            // fetchStudyGroupData
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
            })

            // createGroup
            .addCase(createGroup.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createGroup.fulfilled, (state, action) => {
                state.loading = false;
                state.data.groups.unshift(action.payload);
                state.data.statistics.totalGroups += 1;
                state.data.statistics.activeGroups += 1;
                state.data.lastUpdated = new Date().toISOString();
            })
            .addCase(createGroup.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || '그룹 생성에 실패했습니다.';
            })

            // createPost
            .addCase(createPost.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createPost.fulfilled, (state, action) => {
                state.loading = false;
                state.data.communityPosts.unshift(action.payload);
                state.data.lastUpdated = new Date().toISOString();
            })
            .addCase(createPost.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || '게시글 작성에 실패했습니다.';
            });
    }
});

// ... 기존 exports 유지 (액션 생성자, 선택자 함수들)

export default studyGroupSlice.reducer;