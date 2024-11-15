// features/home/screens/HomeScreen/hooks/useHome.js
import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { fetchWelcomeData } from '../store/slices/welcomeSlice';
import { fetchAchievementData } from '../store/slices/achievementSlice';
import { fetchGoalsData } from '../store/slices/goalSlice';
import { fetchLearningData } from '../store/slices/learningSlice';
import { fetchStudyGroupData } from '../store/slices/studyGroupSlice';

export const useHome = () => {
    const dispatch = useDispatch();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                dispatch(fetchWelcomeData()),
                dispatch(fetchAchievementData()),
                dispatch(fetchGoalsData()),
                dispatch(fetchLearningData()),
                dispatch(fetchStudyGroupData())
            ]);
        } catch (error) {
            console.error('Home refresh error:', error);
        } finally {
            setRefreshing(false);
        }
    }, [dispatch]);

    return {
        refreshing,
        onRefresh
    };
};