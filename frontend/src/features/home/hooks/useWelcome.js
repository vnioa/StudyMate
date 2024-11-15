// features/home/hooks/useWelcome.js
import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { welcomeService } from '../services/welcomeService';
import {
    setWelcomeData,
    setLoading,
    setError,
    resetWelcomeState
} from '../store/slices/welcomeSlice';
import { getTimeBasedMessage } from '../utils/timeUtils';
import { useAppState } from './useAppState';

export const useWelcome = () => {
    const dispatch = useDispatch();
    const { data, loading, error } = useSelector(state => state.welcome);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { appState } = useAppState();

    // 웰컴 데이터 가져오기
    const fetchWelcomeData = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) {
                dispatch(setLoading(true));
            }

            // 여러 API 동시 호출
            const [welcomeData, todayGoalsData, milestonesData] = await Promise.all([
                welcomeService.getWelcomeData(),
                welcomeService.getTodayGoals(),
                welcomeService.getMilestones()
            ]);

            // 시간대별 메시지 생성
            const timeBasedMessage = getTimeBasedMessage();

            // 데이터 통합
            const combinedData = {
                userName: welcomeData.userName,
                timeBasedMessage,
                todayGoals: todayGoalsData,
                milestones: milestonesData,
                lastUpdated: new Date().toISOString()
            };

            dispatch(setWelcomeData(combinedData));
            dispatch(setError(null));

        } catch (err) {
            dispatch(setError(err.message || '데이터를 불러오는데 실패했습니다.'));
            console.error('Welcome Data Fetch Error:', err);
        } finally {
            if (showLoading) {
                dispatch(setLoading(false));
            }
        }
    }, [dispatch]);

    // 새로고침
    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchWelcomeData(false);
        setIsRefreshing(false);
    }, [fetchWelcomeData]);

    // 초기 데이터 로드
    useEffect(() => {
        fetchWelcomeData();

        // 컴포넌트 언마운트 시 상태 초기화
        return () => {
            dispatch(resetWelcomeState());
        };
    }, [dispatch, fetchWelcomeData]);

    // 앱이 백그라운드에서 포그라운드로 전환될 때 데이터 갱신
    useEffect(() => {
        if (appState === 'active') {
            const lastUpdated = new Date(data.lastUpdated);
            const now = new Date();
            const timeDiff = now - lastUpdated;

            // 마지막 업데이트로부터 5분이 지났으면 데이터 갱신
            if (timeDiff > 5 * 60 * 1000) {
                fetchWelcomeData(false);
            }
        }
    }, [appState, data.lastUpdated, fetchWelcomeData]);

    // 주기적인 시간 기반 메시지 업데이트
    useEffect(() => {
        const intervalId = setInterval(() => {
            const newTimeBasedMessage = getTimeBasedMessage();
            if (newTimeBasedMessage !== data.timeBasedMessage) {
                dispatch(setWelcomeData({
                    ...data,
                    timeBasedMessage: newTimeBasedMessage
                }));
            }
        }, 60000); // 1분마다 체크

        return () => clearInterval(intervalId);
    }, [data, dispatch]);

    return {
        // 기본 데이터
        userName: data.userName,
        timeBasedMessage: data.timeBasedMessage,
        todayGoals: data.todayGoals,
        milestones: data.milestones,
        lastUpdated: data.lastUpdated,

        // 상태
        loading,
        error,
        isRefreshing,

        // 액션
        refetch: fetchWelcomeData,
        refresh,
    };
};