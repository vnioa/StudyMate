// features/home/hooks/useLearning.js
import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { learningService } from '../services/learningService';
import {
    setLearningData,
    setLoading,
    setError,
    setRefreshing,
    updateContent,
    addContent,
    removeContent,
    updateProgress,
    resetLearningState,
    rateContentAsync,
    toggleBookmarkAsync
} from '../store/slices/learningSlice';

export const useLearning = () => {
    const dispatch = useDispatch();
    const { data, loading, error, isRefreshing } = useSelector(state => state.learning);

    // 학습 데이터 가져오기
    const fetchLearningData = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) {
                dispatch(setLoading(true));
            }

            const [personalizedData, popularData, recommendationsData, statistics] = await Promise.all([
                learningService.getPersonalizedContent(),
                learningService.getPopularContent(),
                learningService.getRecommendations(),
                learningService.getLearningStatistics()
            ]);

            dispatch(setLearningData({
                personalizedContent: personalizedData,
                popularContent: popularData,
                recommendations: recommendationsData,
                statistics,
                lastUpdated: new Date().toISOString()
            }));
            dispatch(setError(null));

        } catch (err) {
            dispatch(setError(err.message || '학습 데이터를 불러오는데 실패했습니다.'));
            console.error('Learning Data Fetch Error:', err);
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
            await fetchLearningData(false);
        } finally {
            dispatch(setRefreshing(false));
        }
    }, [dispatch, fetchLearningData]);

    // 콘텐츠 추가
    const handleAddContent = useCallback(async (contentData) => {
        try {
            const response = await learningService.addContent(contentData);
            dispatch(addContent(response));
            return response;
        } catch (err) {
            console.error('Content Addition Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 콘텐츠 업데이트
    const handleUpdateContent = useCallback(async (contentId, updates) => {
        try {
            const response = await learningService.updateContent(contentId, updates);
            dispatch(updateContent({ contentId, updates: response }));
            return response;
        } catch (err) {
            console.error('Content Update Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 콘텐츠 삭제
    const handleRemoveContent = useCallback(async (contentId) => {
        try {
            await learningService.removeContent(contentId);
            dispatch(removeContent(contentId));
            return true;
        } catch (err) {
            console.error('Content Removal Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 콘텐츠 진행도 업데이트
    const handleUpdateProgress = useCallback(async (contentId, progress) => {
        try {
            const response = await learningService.updateContentProgress(contentId, progress);
            dispatch(updateProgress({ contentId, progress: response.progress }));
            return response;
        } catch (err) {
            console.error('Progress Update Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 콘텐츠 평가
    const handleRateContent = useCallback(async (contentId, rating) => {
        try {
            const resultAction = await dispatch(rateContentAsync({ contentId, rating }));
            if (rateContentAsync.fulfilled.match(resultAction)) {
                return resultAction.payload;
            }
            throw new Error('Rating failed');
        } catch (err) {
            console.error('Content Rating Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 북마크 토글
    const handleToggleBookmark = useCallback(async (contentId) => {
        try {
            const resultAction = await dispatch(toggleBookmarkAsync(contentId));
            if (toggleBookmarkAsync.fulfilled.match(resultAction)) {
                return resultAction.payload;
            }
            throw new Error('Bookmark toggle failed');
        } catch (err) {
            console.error('Bookmark Toggle Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 초기 데이터 로드
    useEffect(() => {
        fetchLearningData();
        return () => {
            dispatch(resetLearningState());
        };
    }, [dispatch, fetchLearningData]);

    // 주기적인 데이터 갱신 (10분마다)
    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchLearningData(false);
        }, 10 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [fetchLearningData]);

    return {
        // 데이터
        personalizedContent: data.personalizedContent || [],
        popularContent: data.popularContent || [],
        recommendations: data.recommendations || [],
        statistics: data.statistics || {},
        lastUpdated: data.lastUpdated,

        // 상태
        loading,
        error,
        isRefreshing,

        // 액션
        refresh,
        addContent: handleAddContent,
        updateContent: handleUpdateContent,
        removeContent: handleRemoveContent,
        updateProgress: handleUpdateProgress,
        rateContent: handleRateContent,
        toggleBookmark: handleToggleBookmark
    };
};

export default useLearning;