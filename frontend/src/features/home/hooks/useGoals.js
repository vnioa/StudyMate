// features/home/hooks/useGoals.js
import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { goalService } from '../services/goalService';
import {
    setGoalsData,
    setLoading,
    setError,
    setRefreshing,
    updateGoalProgress,
    addGoal,
    removeGoal,
    updateGoal,
    resetGoalState
} from '../store/slices/goalSlice';
import { getTimeBasedMessage } from '../utils/timeUtils';

export const useGoals = () => {
    const dispatch = useDispatch();
    const { data, loading, error } = useSelector(state => state.goals);
    const [timeMessage, setTimeMessage] = useState('');

    // 시간대별 메시지 업데이트
    useEffect(() => {
        const message = getTimeBasedMessage();
        setTimeMessage(message);

        const intervalId = setInterval(() => {
            setTimeMessage(getTimeBasedMessage());
        }, 60 * 1000); // 1분마다 업데이트

        return () => clearInterval(intervalId);
    }, []);

    // 목표 데이터 가져오기
    const fetchGoals = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) {
                dispatch(setLoading(true));
            }

            // 여러 API 동시 호출
            const [goalsData, progressData, feedbackData, remindersData] = await Promise.all([
                goalService.getTodayGoals(),
                goalService.getGoalProgress(),
                goalService.getAIFeedback(),
                goalService.getReminders()
            ]);

            // 데이터 통합
            const combinedData = {
                goals: goalsData,
                progress: progressData,
                feedback: {
                    message: feedbackData.message,
                    suggestions: feedbackData.suggestions
                },
                reminders: remindersData,
                lastUpdated: new Date().toISOString()
            };

            dispatch(setGoalsData(combinedData));
            dispatch(setError(null));

        } catch (err) {
            dispatch(setError(err.message || '목표 데이터를 불러오는데 실패했습니다.'));
            console.error('Goals Data Fetch Error:', err);
        } finally {
            if (showLoading) {
                dispatch(setLoading(false));
            }
        }
    }, [dispatch]);

    // 새로고침
    const refresh = useCallback(async () => {
        dispatch(setRefreshing(true));
        try {
            await fetchGoals(false);
        } finally {
            dispatch(setRefreshing(false));
        }
    }, [dispatch, fetchGoals]);

    // 목표 추가
    const createGoal = useCallback(async (goalData) => {
        try {
            const response = await goalService.createGoal(goalData);
            dispatch(addGoal(response));
            return response;
        } catch (err) {
            console.error('Goal Creation Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 목표 수정
    const updateGoalData = useCallback(async (goalId, updates) => {
        try {
            const response = await goalService.updateGoal(goalId, updates);
            dispatch(updateGoal({ goalId, updates: response }));
            return response;
        } catch (err) {
            console.error('Goal Update Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 목표 삭제
    const deleteGoal = useCallback(async (goalId) => {
        try {
            await goalService.deleteGoal(goalId);
            dispatch(removeGoal(goalId));
            return true;
        } catch (err) {
            console.error('Goal Deletion Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 목표 진행도 업데이트
    const updateProgress = useCallback(async (goalId, progress) => {
        try {
            const response = await goalService.updateGoalProgress(goalId, progress);
            dispatch(updateGoalProgress({ goalId, progress: response.progress }));
            return response;
        } catch (err) {
            console.error('Progress Update Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 리마인더 토글
    const toggleReminder = useCallback(async (reminderId) => {
        try {
            const response = await goalService.toggleReminder(reminderId);
            dispatch(updateGoal({
                goalId: reminderId,
                updates: { isEnabled: response.isEnabled }
            }));
            return response;
        } catch (err) {
            console.error('Reminder Toggle Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 목표 우선순위 변경
    const updatePriority = useCallback(async (goalId, priority) => {
        try {
            const response = await goalService.updateGoalPriority(goalId, priority);
            dispatch(updateGoal({
                goalId,
                updates: { priority: response.priority }
            }));
            return response;
        } catch (err) {
            console.error('Priority Update Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 초기 데이터 로드
    useEffect(() => {
        fetchGoals();
        return () => {
            dispatch(resetGoalState());
        };
    }, [dispatch, fetchGoals]);

    // 주기적인 데이터 갱신 (5분마다)
    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchGoals(false);
        }, 5 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [fetchGoals]);

    return {
        // 데이터
        goals: data.goals || [],
        progress: data.progress || {},
        feedback: data.feedback || {},
        reminders: data.reminders || [],
        lastUpdated: data.lastUpdated,
        timeMessage,

        // 상태
        loading,
        error,
        isRefreshing: data.isRefreshing,

        // 액션
        refresh,
        createGoal,
        updateGoalData,
        deleteGoal,
        updateProgress,
        toggleReminder,
        updatePriority
    };
};

export default useGoals;