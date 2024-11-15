// features/home/store/slices/goalSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { goalService } from '../../services/goalService';

// Async Thunk Actions
export const fetchGoalsData = createAsyncThunk(
    'goals/fetchGoalsData',
    async (_, { rejectWithValue }) => {
        try {
            const [goals, progress, feedback, reminders, statistics] = await Promise.all([
                goalService.getTodayGoals(),
                goalService.getGoalProgress(),
                goalService.getAIFeedback(),
                goalService.getReminders(),
                goalService.getGoalStatistics()
            ]);

            return {
                goals,
                progress: {
                    daily: progress.daily,
                    weekly: progress.weekly,
                    monthly: progress.monthly
                },
                feedback: {
                    message: feedback.message,
                    suggestions: feedback.suggestions
                },
                reminders,
                statistics: {
                    totalStudyTime: statistics.totalStudyTime,
                    completedGoals: statistics.completedGoals,
                    currentStreak: statistics.currentStreak,
                    averageProgress: statistics.averageProgress
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
        goals: [],           // 목표 목록
        progress: {          // 학습 진행도
            daily: 0,         // 일일 진행률
            weekly: 0,        // 주간 진행률
            monthly: 0        // 월간 진행률
        },
        feedback: {         // AI 피드백
            message: '',      // 피드백 메시지
            suggestions: []   // 개선 제안
        },
        reminders: [],      // 리마인더 목록
        statistics: {       // 학습 통계
            totalStudyTime: 0,    // 총 학습 시간
            completedGoals: 0,    // 완료한 목표 수
            currentStreak: 0,     // 현재 연속 학습일
            averageProgress: 0    // 평균 진행률
        },
        lastUpdated: null   // 마지막 업데이트 시간
    },
    loading: false,
    error: null,
    isRefreshing: false
};

const goalSlice = createSlice({
    name: 'goals',
    initialState,
    reducers: {
        // 목표 데이터 설정
        setGoalsData: (state, action) => {
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

        // 새 목표 추가
        addGoal: (state, action) => {
            state.data.goals.unshift(action.payload);
            state.data.lastUpdated = new Date().toISOString();
        },

        // 목표 수정
        updateGoal: (state, action) => {
            const { goalId, updates } = action.payload;
            const goalIndex = state.data.goals.findIndex(goal => goal.id === goalId);
            if (goalIndex !== -1) {
                state.data.goals[goalIndex] = {
                    ...state.data.goals[goalIndex],
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
            }
        },

        // 목표 삭제
        removeGoal: (state, action) => {
            state.data.goals = state.data.goals.filter(goal => goal.id !== action.payload);
            state.data.lastUpdated = new Date().toISOString();
        },

        // 목표 진행도 업데이트
        updateGoalProgress: (state, action) => {
            const { goalId, progress } = action.payload;
            const goalIndex = state.data.goals.findIndex(goal => goal.id === goalId);
            if (goalIndex !== -1) {
                state.data.goals[goalIndex].progress = progress;
                state.data.goals[goalIndex].updatedAt = new Date().toISOString();
            }
        },

        // 리마인더 추가
        addReminder: (state, action) => {
            state.data.reminders.unshift(action.payload);
        },

        // 리마인더 수정
        updateReminder: (state, action) => {
            const { reminderId, updates } = action.payload;
            const reminderIndex = state.data.reminders.findIndex(
                reminder => reminder.id === reminderId
            );
            if (reminderIndex !== -1) {
                state.data.reminders[reminderIndex] = {
                    ...state.data.reminders[reminderIndex],
                    ...updates
                };
            }
        },

        // 리마인더 삭제
        removeReminder: (state, action) => {
            state.data.reminders = state.data.reminders.filter(
                reminder => reminder.id !== action.payload
            );
        },

        // AI 피드백 업데이트
        updateFeedback: (state, action) => {
            state.data.feedback = {
                ...state.data.feedback,
                ...action.payload
            };
        },

        // 통계 업데이트
        updateStatistics: (state, action) => {
            state.data.statistics = {
                ...state.data.statistics,
                ...action.payload
            };
        },

        // 목표 우선순위 변경
        updateGoalPriority: (state, action) => {
            const { goalId, priority } = action.payload;
            const goalIndex = state.data.goals.findIndex(goal => goal.id === goalId);
            if (goalIndex !== -1) {
                state.data.goals[goalIndex].priority = priority;
                state.data.goals[goalIndex].updatedAt = new Date().toISOString();
            }
        },

        // 목표 완료 처리
        completeGoal: (state, action) => {
            const goalIndex = state.data.goals.findIndex(goal => goal.id === action.payload);
            if (goalIndex !== -1) {
                state.data.goals[goalIndex].completed = true;
                state.data.goals[goalIndex].completedAt = new Date().toISOString();
                state.data.statistics.completedGoals += 1;
            }
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
        resetGoalState: () => initialState
    },
    extraReducers: (builder) => {
        builder
            // fetchGoalsData
            .addCase(fetchGoalsData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchGoalsData.fulfilled, (state, action) => {
                state.loading = false;
                state.data = {
                    ...state.data,
                    ...action.payload
                };
                state.error = null;
            })
            .addCase(fetchGoalsData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || '데이터를 불러오는데 실패했습니다.';
            });
    }
});

// 액션 생성자 내보내기
export const {
    setGoalsData,
    setLoading,
    setError,
    setRefreshing,
    addGoal,
    updateGoal,
    removeGoal,
    updateGoalProgress,
    addReminder,
    updateReminder,
    removeReminder,
    updateFeedback,
    updateStatistics,
    updateGoalPriority,
    completeGoal,
    updatePartialData,
    resetGoalState
} = goalSlice.actions;

// 선택자 함수들
export const selectGoalsData = (state) => state.goals.data;
export const selectGoalsLoading = (state) => state.goals.loading;
export const selectGoalsError = (state) => state.goals.error;
export const selectIsRefreshing = (state) => state.goals.isRefreshing;
export const selectGoals = (state) => state.goals.data.goals;
export const selectProgress = (state) => state.goals.data.progress;
export const selectFeedback = (state) => state.goals.data.feedback;
export const selectReminders = (state) => state.goals.data.reminders;
export const selectStatistics = (state) => state.goals.data.statistics;
export const selectLastUpdated = (state) => state.goals.data.lastUpdated;

// 리듀서 내보내기
export default goalSlice.reducer;