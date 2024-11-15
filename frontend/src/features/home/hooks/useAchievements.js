// features/home/hooks/useAchievements.js
import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { achievementService } from '../services/achievementService';
import {
    setAchievementData,
    setLoading,
    setError,
    updateProgress,
    addBadge,
    resetAchievementState
} from '../store/slices/achievementSlice';

export const useAchievements = () => {
    const dispatch = useDispatch();
    const { data, loading, error } = useSelector(state => state.achievements);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // 성과 데이터 가져오기
    const fetchAchievements = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) {
                dispatch(setLoading(true));
            }

            // 여러 API 동시 호출
            const [achievementsData, progressData, statsData] = await Promise.all([
                achievementService.getRecentBadges(),
                achievementService.getLearningProgress(),
                achievementService.getStudyStatistics()
            ]);

            // 데이터 통합
            const combinedData = {
                badges: achievementsData,
                progress: {
                    total: progressData.totalProgress,
                    daily: progressData.dailyProgress,
                    weekly: progressData.weeklyProgress
                },
                stats: {
                    totalStudyTime: statsData.totalStudyTime,
                    completedGoals: statsData.completedGoals,
                    earnedBadges: statsData.earnedBadges,
                    streak: statsData.streak
                },
                lastUpdated: new Date().toISOString()
            };

            dispatch(setAchievementData(combinedData));
            dispatch(setError(null));

        } catch (err) {
            dispatch(setError(err.message || '데이터를 불러오는데 실패했습니다.'));
            console.error('Achievement Data Fetch Error:', err);
        } finally {
            if (showLoading) {
                dispatch(setLoading(false));
            }
        }
    }, [dispatch]);

    // 새로고침
    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchAchievements(false);
        setIsRefreshing(false);
    }, [fetchAchievements]);

    // 진행도 업데이트
    const updateAchievementProgress = useCallback(async (progressData) => {
        try {
            const response = await achievementService.updateProgress(progressData);
            dispatch(updateProgress(response));
            return response;
        } catch (err) {
            console.error('Progress Update Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 배지 상세 정보 조회
    const getBadgeDetails = useCallback(async (badgeId) => {
        try {
            return await achievementService.getBadgeDetails(badgeId);
        } catch (err) {
            console.error('Badge Details Fetch Error:', err);
            throw err;
        }
    }, []);

    // 새로운 배지 획득
    const claimNewBadge = useCallback(async (badgeId) => {
        try {
            const response = await achievementService.claimNewBadge(badgeId);
            dispatch(addBadge(response));
            return response;
        } catch (err) {
            console.error('Badge Claim Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 배지 공유
    const shareBadge = useCallback(async (badgeId, platform) => {
        try {
            return await achievementService.shareBadge(badgeId, platform);
        } catch (err) {
            console.error('Badge Share Error:', err);
            throw err;
        }
    }, []);

    // 통계 내보내기
    const exportStatistics = useCallback(async (format = 'pdf') => {
        try {
            return await achievementService.exportStatistics(format);
        } catch (err) {
            console.error('Statistics Export Error:', err);
            throw err;
        }
    }, []);

    // 초기 데이터 로드
    useEffect(() => {
        fetchAchievements();

        // 컴포넌트 언마운트 시 상태 초기화
        return () => {
            dispatch(resetAchievementState());
        };
    }, [dispatch, fetchAchievements]);

    // 주기적인 데이터 갱신 (5분마다)
    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchAchievements(false);
        }, 5 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [fetchAchievements]);

    return {
        // 기본 데이터
        badges: data.badges,
        progress: data.progress,
        stats: data.stats,
        lastUpdated: data.lastUpdated,

        // 상태
        loading,
        error,
        isRefreshing,

        // 액션
        refresh,
        updateProgress: updateAchievementProgress,
        getBadgeDetails,
        claimNewBadge,
        shareBadge,
        exportStatistics
    };
};

export default useAchievements;