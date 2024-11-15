// features/home/components/WelcomeSection/index.js
import React from 'react';
import { View } from 'react-native';
import WelcomeMessage from './WelcomeMessage';
import TodayGoals from './TodayGoals';
import Milestones from './Milestones';
import { useWelcome } from '../../hooks/useWelcome';
import Loading from '../../../../components/common/Loading';
import ErrorView from '../../../../components/common/ErrorView';
import styles from './styles';

const WelcomeSection = () => {
    const { loading, error, refetch } = useWelcome();

    if (loading) return <Loading />;
    if (error) return <ErrorView message={error} onRetry={refetch} />;

    return (
        <View style={styles.container}>
            <WelcomeMessage />
            <TodayGoals />
            <Milestones />
        </View>
    );
};

export default WelcomeSection;