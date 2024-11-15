// features/home/hooks/useMilestones.js
import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { welcomeService } from '../services/welcomeService';
import {
    setMilestoneData,
    setLoading,
    setError,
    setRefreshing,
    addMilestone,
    updateMilestone,
    removeMilestone,
    resetMilestoneState
} from '../store/slices/welcomeSlice';

export const useMilestones = () => {
    const dispatch = useDispatch();
    const { data, loading, error } = useSelector(state => state.welcome);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // 마일스톤 데이터 가져오기
    const fetchMilestones = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) {
                dispatch(setLoading(true));
            }

            const [milestonesData, statistics] = await Promise.all([
                welcomeService.getMilestones(),
                welcomeService.getMilestoneStatistics()
            ]);

            // 마일스톤 데이터 가공 및 정렬
            const processedMilestones = milestonesData
                .map(milestone => ({
                    ...milestone,
                    formattedDate: new Date(milestone.date).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })
                }))
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            dispatch(setMilestoneData({
                milestones: processedMilestones,
                statistics,
                lastUpdated: new Date().toISOString()
            }));
            dispatch(setError(null));
            dispatch(setRefreshing(false));

        } catch (err) {
            dispatch(setError(err.message || '마일스톤 데이터를 불러오는데 실패했습니다.'));
            console.error('Milestones Data Fetch Error:', err);
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
            await fetchMilestones(false);
        } finally {
            dispatch(setRefreshing(false));
        }
    }, [dispatch, fetchMilestones]);

    // 마일스톤 추가
    const handleCreateMilestone = useCallback(async (milestoneData) => {
        try {
            const response = await welcomeService.createMilestone(milestoneData);
            const processedMilestone = {
                ...response,
                formattedDate: new Date(response.date).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            };
            dispatch(addMilestone(processedMilestone));
            return processedMilestone;
        } catch (err) {
            console.error('Milestone Creation Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 마일스톤 수정
    const handleUpdateMilestone = useCallback(async (milestoneId, updates) => {
        try {
            const response = await welcomeService.updateMilestone(milestoneId, updates);
            const processedUpdate = {
                ...response,
                formattedDate: new Date(response.date).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            };
            dispatch(updateMilestone({ milestoneId, updates: processedUpdate }));
            return processedUpdate;
        } catch (err) {
            console.error('Milestone Update Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 마일스톤 삭제
    const handleDeleteMilestone = useCallback(async (milestoneId) => {
        try {
            await welcomeService.deleteMilestone(milestoneId);
            dispatch(removeMilestone(milestoneId));
            return true;
        } catch (err) {
            console.error('Milestone Deletion Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 마일스톤 달성 체크
    const handleCheckAchievement = useCallback(async (milestoneId) => {
        try {
            const response = await welcomeService.checkMilestoneAchievement(milestoneId);
            if (response.isAchieved) {
                dispatch(updateMilestone({
                    milestoneId,
                    updates: {
                        isAchieved: true,
                        achievedAt: new Date().toISOString()
                    }
                }));
            }
            return response;
        } catch (err) {
            console.error('Milestone Achievement Check Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 초기 데이터 로드
    useEffect(() => {
        fetchMilestones();
        return () => {
            dispatch(resetMilestoneState());
        };
    }, [dispatch, fetchMilestones]);

    // 주기적인 데이터 갱신 (5분마다)
    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchMilestones(false);
        }, 5 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [fetchMilestones]);

    return {
        // 데이터
        milestones: data.milestones || [],
        statistics: data.statistics || {},
        lastUpdated: data.lastUpdated,

        // 상태
        loading,
        error,
        isRefreshing,

        // 액션
        refresh,
        createMilestone: handleCreateMilestone,
        updateMilestone: handleUpdateMilestone,
        deleteMilestone: handleDeleteMilestone,
        checkAchievement: handleCheckAchievement
    };
};

export default useMilestones;