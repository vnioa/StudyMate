// features/home/components/AchievementSection/index.js
import React from 'react';
import { View } from 'react-native';
import AchievementBadges from './AchievementBadges';
import ProgressChart from './ProgressChart';
import StatsDashboard from './StatsDashboard';
import { useAchievements } from '../../../hooks/useAchievements';
import Loading from '../../../../../components/common/Loading';
import ErrorView from '../../../../../components/common/ErrorView';
import styles from './styles';

const AchievementSection = () => {
    const { loading, error, refetch } = useAchievements();

    if (loading) return <Loading />;
    if (error) return <ErrorView message={error} onRetry={refetch} />;

    return (
        <View style={styles.container}>
            <AchievementBadges />
            <ProgressChart />
            <StatsDashboard />
        </View>
    );
};

export default AchievementSection;