// features/home/components/GoalSection/index.js
import React from 'react';
import { View } from 'react-native';
import AIFeedback from './AIFeedback';
import GoalManager from './GoalManager';
import Reminders from './Reminders';
import { useGoals } from '../../hooks/useGoals';
import Loading from '../../../../components/common/Loading';
import ErrorView from '../../../../components/common/ErrorView';
import styles from './styles';

const GoalSection = () => {
    const { loading, error, refetch } = useGoals();

    if (loading) return <Loading />;
    if (error) return <ErrorView message={error} onRetry={refetch} />;

    return (
        <View style={styles.container}>
            <GoalManager />
            <AIFeedback />
            <Reminders />
        </View>
    );
};

export default GoalSection;