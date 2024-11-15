// features/home/store/slices/learningSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { learningService } from '../../services/learningService';

// Async Thunk Actions
export const fetchLearningData = createAsyncThunk(
    'learning/fetchLearningData',
    async (_, { rejectWithValue }) => {
        try {
            const [
                personalizedContent,
                popularContent,
                recommendations,
                history,
                statistics
            ] = await Promise.all([
                learningService.getPersonalizedContent(),
                learningService.getPopularContent(),
                learningService.getRecommendations(),
                learningService.getLearningHistory(),
                learningService.getLearningStatistics()
            ]);

            return {
                personalizedContent,
                popularContent,
                recommendations,
                history,
                statistics,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// 콘텐츠 평가 Thunk
export const rateContentAsync = createAsyncThunk(
    'learning/rateContent',
    async ({ contentId, rating }, { rejectWithValue }) => {
        try {
            const response = await learningService.rateContent(contentId, rating);
            return { contentId, rating: response.rating };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// 북마크 토글 Thunk
export const toggleBookmarkAsync = createAsyncThunk(
    'learning/toggleBookmark',
    async (contentId, { rejectWithValue }) => {
        try {
            const response = await learningService.toggleBookmark(contentId);
            return { contentId, isBookmarked: response.isBookmarked };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    data: {
        personalizedContent: [],
        popularContent: [],
        recommendations: [],
        bookmarks: [],
        history: [],
        progress: {
            daily: 0,
            weekly: 0,
            monthly: 0
        },
        statistics: {
            totalLearningTime: 0,
            completedContents: 0,
            averageRating: 0,
            streak: 0
        },
        lastUpdated: null
    },
    loading: false,
    error: null,
    isRefreshing: false
};

const learningSlice = createSlice({
    name: 'learning',
    initialState,
    reducers: {
        setLearningData: (state, action) => {
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

        updateContent: (state, action) => {
            const { contentId, updates } = action.payload;
            const updateInList = (list) => {
                const index = list.findIndex(item => item.id === contentId);
                if (index !== -1) {
                    list[index] = { ...list[index], ...updates };
                }
            };

            updateInList(state.data.personalizedContent);
            updateInList(state.data.popularContent);
            updateInList(state.data.recommendations);
        },

        addContent: (state, action) => {
            state.data.personalizedContent.unshift(action.payload);
        },

        removeContent: (state, action) => {
            const contentId = action.payload;
            state.data.personalizedContent = state.data.personalizedContent.filter(
                content => content.id !== contentId
            );
            state.data.popularContent = state.data.popularContent.filter(
                content => content.id !== contentId
            );
            state.data.recommendations = state.data.recommendations.filter(
                content => content.id !== contentId
            );
        },

        updateProgress: (state, action) => {
            const { contentId, progress } = action.payload;
            const content = state.data.personalizedContent.find(
                item => item.id === contentId
            );
            if (content) {
                content.progress = progress;
            }
        },

        resetLearningState: () => initialState
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchLearningData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchLearningData.fulfilled, (state, action) => {
                state.loading = false;
                state.data = {
                    ...state.data,
                    ...action.payload
                };
                state.error = null;
            })
            .addCase(fetchLearningData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || '데이터를 불러오는데 실패했습니다.';
            })
            .addCase(rateContentAsync.fulfilled, (state, action) => {
                const { contentId, rating } = action.payload;
                const updateRating = (list) => {
                    const contentIndex = list.findIndex(content => content.id === contentId);
                    if (contentIndex !== -1) {
                        list[contentIndex].rating = rating;
                        list[contentIndex].userRated = true;
                    }
                };

                updateRating(state.data.personalizedContent);
                updateRating(state.data.popularContent);
                updateRating(state.data.recommendations);
            })
            .addCase(toggleBookmarkAsync.fulfilled, (state, action) => {
                const { contentId, isBookmarked } = action.payload;
                const content = [
                    ...state.data.personalizedContent,
                    ...state.data.popularContent,
                    ...state.data.recommendations
                ].find(content => content.id === contentId);

                if (content) {
                    if (isBookmarked) {
                        state.data.bookmarks.unshift({
                            ...content,
                            bookmarkedAt: new Date().toISOString()
                        });
                    } else {
                        state.data.bookmarks = state.data.bookmarks.filter(
                            b => b.id !== contentId
                        );
                    }
                }
            });
    }
});

export const {
    setLearningData,
    setLoading,
    setError,
    setRefreshing,
    updateContent,
    addContent,
    removeContent,
    updateProgress,
    resetLearningState
} = learningSlice.actions;

export const selectLearningData = (state) => state.learning.data;
export const selectLearningLoading = (state) => state.learning.loading;
export const selectLearningError = (state) => state.learning.error;
export const selectIsRefreshing = (state) => state.learning.isRefreshing;
export const selectPersonalizedContent = (state) => state.learning.data.personalizedContent;
export const selectPopularContent = (state) => state.learning.data.popularContent;
export const selectRecommendations = (state) => state.learning.data.recommendations;
export const selectBookmarks = (state) => state.learning.data.bookmarks;
export const selectHistory = (state) => state.learning.data.history;
export const selectProgress = (state) => state.learning.data.progress;
export const selectStatistics = (state) => state.learning.data.statistics;
export const selectLastUpdated = (state) => state.learning.data.lastUpdated;

export default learningSlice.reducer;