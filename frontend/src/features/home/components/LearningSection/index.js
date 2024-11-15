// features/home/components/LearningSection/index.js
import React from 'react';
import { View } from 'react-native';
import PersonalizedContent from './PersonalizedContent';
import PopularContent from './PopularContent';
import { useLearning } from '../../hooks/useLearning';
import Loading from '../../../../components/common/Loading';
import ErrorView from '../../../../components/common/ErrorView';
import styles from './styles';

const LearningSection = () => {
    const { loading, error, refetch } = useLearning();

    if (loading) return <Loading />;
    if (error) return <ErrorView message={error} onRetry={refetch} />;

    return (
        <View style={styles.container}>
            <PersonalizedContent />
            <PopularContent />
        </View>
    );
};

export default LearningSection;