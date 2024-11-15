// features/home/store/slices/achievementSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { achievementService } from '../../services/achievementService';

// Async Thunk Actions
export const fetchAchievementData = createAsyncThunk(
    'achievements/fetchAchievementData',
    async (_, { rejectWithValue }) => {
        try {
            const [achievements, progress, stats] = await Promise.all([
                achievementService.getAchievements(),
                achievementService.getLearningProgress(),
                achievementService.getStudyStatistics()
            ]);

            return {
                badges: achievements.badges,
                progress: {
                    total: progress.total,
                    daily: progress.daily,
                    weekly: progress.weekly,
                    monthly: progress.monthly
                },
                stats: {
                    totalStudyTime: stats.totalStudyTime,
                    completedGoals: stats.completedGoals,
                    earnedBadges: stats.earnedBadges,
                    streak: stats.streak,
                    averageStudyTime: stats.averageStudyTime,
                    bestStudyTime: stats.bestStudyTime
                },
                recentAchievements: achievements.recent,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    data: {
        badges: [],          // 획득한 배지 목록
        progress: {          // 학습 진행도
            total: 0,         // 전체 진행률
            daily: 0,         // 일일 진행률
            weekly: 0,        // 주간 진행률
            monthly: 0        // 월간 진행률
        },
        stats: {            // 학습 통계
            totalStudyTime: 0,    // 총 학습 시간
            completedGoals: 0,    // 완료한 목표 수
            earnedBadges: 0,      // 획득한 배지 수
            streak: 0,            // 연속 학습일
            averageStudyTime: 0,  // 평균 학습 시간
            bestStudyTime: 0      // 최고 학습 시간
        },
        recentAchievements: [], // 최근 성과 목록
        lastUpdated: null       // 마지막 업데이트 시간
    },
    loading: false,
    error: null,
    isRefreshing: false
};

const achievementSlice = createSlice({
    name: 'achievements',
    initialState,
    reducers: {
        // 성과 데이터 설정
        setAchievementData: (state, action) => {
            state.data = {
                ...state.data,
                ...action.payload,
                lastUpdated: new Date().toISOString()
            };
            state.error = null;
        },

        // 로딩 상태 설정
        setLoading: (state, action) => {
            state.loading = action.payload;
        },

        // 에러 상태 설정
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },

        // 새로고침 상태 설정
        setRefreshing: (state, action) => {
            state.isRefreshing = action.payload;
        },

        // 진행도 업데이트
        updateProgress: (state, action) => {
            state.data.progress = {
                ...state.data.progress,
                ...action.payload
            };
        },

        // 새로운 배지 추가
        addBadge: (state, action) => {
            state.data.badges.unshift(action.payload);
            state.data.stats.earnedBadges += 1;
        },

        // 배지 업데이트
        updateBadge: (state, action) => {
            const { badgeId, updates } = action.payload;
            const badgeIndex = state.data.badges.findIndex(
                badge => badge.id === badgeId
            );
            if (badgeIndex !== -1) {
                state.data.badges[badgeIndex] = {
                    ...state.data.badges[badgeIndex],
                    ...updates
                };
            }
        },

        // 통계 업데이트
        updateStats: (state, action) => {
            state.data.stats = {
                ...state.data.stats,
                ...action.payload
            };
        },

        // 최근 성과 추가
        addRecentAchievement: (state, action) => {
            state.data.recentAchievements.unshift(action.payload);
            if (state.data.recentAchievements.length > 10) {
                state.data.recentAchievements.pop();
            }
        },

        // 연속 학습일 업데이트
        updateStreak: (state, action) => {
            state.data.stats.streak = action.payload;
        },

        // 학습 시간 업데이트
        updateStudyTime: (state, action) => {
            const { totalTime, averageTime, bestTime } = action.payload;
            state.data.stats.totalStudyTime = totalTime;
            state.data.stats.averageStudyTime = averageTime;
            state.data.stats.bestStudyTime = bestTime;
        },

        // 목표 완료 처리
        completeGoal: (state) => {
            state.data.stats.completedGoals += 1;
        },

        // 부분 데이터 업데이트
        updatePartialData: (state, action) => {
            state.data = {
                ...state.data,
                ...action.payload,
                lastUpdated: new Date().toISOString()
            };
        },

        // 상태 초기화
        resetAchievementState: () => initialState
    },
    extraReducers: (builder) => {
        builder
            // fetchAchievementData
            .addCase(fetchAchievementData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAchievementData.fulfilled, (state, action) => {
                state.loading = false;
                state.data = {
                    ...state.data,
                    ...action.payload
                };
                state.error = null;
            })
            .addCase(fetchAchievementData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || '데이터를 불러오는데 실패했습니다.';
            });
    }
});

// 액션 생성자 내보내기
export const {
    setAchievementData,
    setLoading,
    setError,
    setRefreshing,
    updateProgress,
    addBadge,
    updateBadge,
    updateStats,
    addRecentAchievement,
    updateStreak,
    updateStudyTime,
    completeGoal,
    updatePartialData,
    resetAchievementState
} = achievementSlice.actions;

// 선택자 함수들
export const selectAchievementData = (state) => state.achievements.data;
export const selectAchievementLoading = (state) => state.achievements.loading;
export const selectAchievementError = (state) => state.achievements.error;
export const selectIsRefreshing = (state) => state.achievements.isRefreshing;
export const selectBadges = (state) => state.achievements.data.badges;
export const selectProgress = (state) => state.achievements.data.progress;
export const selectStats = (state) => state.achievements.data.stats;
export const selectRecentAchievements = (state) => state.achievements.data.recentAchievements;
export const selectLastUpdated = (state) => state.achievements.data.lastUpdated;

// 리듀서 내보내기
export default achievementSlice.reducer;