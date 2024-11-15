// features/home/store/slices/welcomeSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { welcomeService } from '../../services/welcomeService';

// Async Thunk Actions
export const fetchWelcomeData = createAsyncThunk(
    'welcome/fetchWelcomeData',
    async (_, { rejectWithValue }) => {
        try {
            const [userData, todayGoals, milestones, notifications, stats] = await Promise.all([
                welcomeService.getUserData(),
                welcomeService.getTodayGoals(),
                welcomeService.getMilestones(),
                welcomeService.getNotifications(),
                welcomeService.getStudyStats()
            ]);

            const timeBasedMessage = welcomeService.getTimeBasedMessage();

            return {
                userName: userData.name,
                timeBasedMessage,
                todayGoals,
                milestones,
                notifications,
                progress: {
                    daily: stats.dailyProgress,
                    weekly: stats.weeklyProgress,
                    monthly: stats.monthlyProgress
                },
                achievements: {
                    total: stats.totalAchievements,
                    recent: stats.recentAchievements,
                    badges: stats.earnedBadges
                },
                stats: {
                    totalStudyTime: stats.totalStudyTime,
                    completedGoals: stats.completedGoals,
                    currentStreak: stats.currentStreak
                },
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    data: {
        userName: '',
        timeBasedMessage: '',
        todayGoals: [],          // 오늘의 학습 목표 목록
        milestones: [],          // 주요 성과 목록
        notifications: [],       // 알림 목록
        progress: {             // 학습 진행도
            daily: 0,            // 일일 진행률
            weekly: 0,           // 주간 진행률
            monthly: 0           // 월간 진행률
        },
        achievements: {         // 성취 현황
            total: 0,            // 전체 성취도
            recent: [],          // 최근 성취 목록
            badges: []           // 획득한 배지 목록
        },
        stats: {               // 학습 통계
            totalStudyTime: 0,   // 총 학습 시간
            completedGoals: 0,   // 완료한 목표 수
            currentStreak: 0     // 현재 연속 학습일
        },
        lastUpdated: null      // 마지막 업데이트 시간
    },
    loading: false,
    error: null,
    isRefreshing: false
};

const welcomeSlice = createSlice({
    name: 'welcome',
    initialState,
    reducers: {
        setWelcomeData: (state, action) => {
            state.data = {
                ...state.data,
                ...action.payload,
                lastUpdated: new Date().toISOString()
            };
            state.error = null;
        },

        setMilestoneData: (state, action) => {
            state.data = {
                ...state.data,
                milestones: action.payload.milestones,
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

        addMilestone: (state, action) => {
            state.data.milestones.unshift(action.payload);
        },

        updateMilestone: (state, action) => {
            const { milestoneId, updates } = action.payload;
            const milestoneIndex = state.data.milestones.findIndex(
                milestone => milestone.id === milestoneId
            );
            if (milestoneIndex !== -1) {
                state.data.milestones[milestoneIndex] = {
                    ...state.data.milestones[milestoneIndex],
                    ...updates
                };
            }
        },

        removeMilestone: (state, action) => {
            state.data.milestones = state.data.milestones.filter(
                milestone => milestone.id !== action.payload
            );
        },

        resetMilestoneState: (state) => {
            state.data.milestones = [];
            state.loading = false;
            state.error = null;
            state.isRefreshing = false;
        },

        resetWelcomeState: () => initialState
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWelcomeData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWelcomeData.fulfilled, (state, action) => {
                state.loading = false;
                state.data = {
                    ...state.data,
                    ...action.payload
                };
                state.error = null;
            })
            .addCase(fetchWelcomeData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || '데이터를 불러오는데 실패했습니다.';
            });
    }
});

// 액션 생성자 내보내기
export const {
    setWelcomeData,
    setMilestoneData,
    setLoading,
    setError,
    setRefreshing,
    addMilestone,
    updateMilestone,
    removeMilestone,
    resetMilestoneState,
    resetWelcomeState
} = welcomeSlice.actions;

// 선택자 함수들
export const selectWelcomeData = (state) => state.welcome.data;
export const selectWelcomeLoading = (state) => state.welcome.loading;
export const selectWelcomeError = (state) => state.welcome.error;
export const selectIsRefreshing = (state) => state.welcome.isRefreshing;
export const selectUserName = (state) => state.welcome.data.userName;
export const selectTimeBasedMessage = (state) => state.welcome.data.timeBasedMessage;
export const selectTodayGoals = (state) => state.welcome.data.todayGoals;
export const selectMilestones = (state) => state.welcome.data.milestones;
export const selectNotifications = (state) => state.welcome.data.notifications;
export const selectProgress = (state) => state.welcome.data.progress;
export const selectAchievements = (state) => state.welcome.data.achievements;
export const selectStats = (state) => state.welcome.data.stats;
export const selectLastUpdated = (state) => state.welcome.data.lastUpdated;

export default welcomeSlice.reducer;