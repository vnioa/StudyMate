// features/home/components/StudyGroupSection/index.js
import React from 'react';
import { View } from 'react-native';
import CommunityFeed from './CommunityFeed';
import GroupSummary from './GroupSummary';
import NotificationCenter from './NotificationCenter';
import { useStudyGroup } from '../../hooks/useStudyGroup';
import Loading from '../../../../components/common/Loading';
import ErrorView from '../../../../components/common/ErrorView';
import styles from './styles';

const StudyGroupSection = () => {
    const { loading, error, refetch } = useStudyGroup();

    if (loading) return <Loading />;
    if (error) return <ErrorView message={error} onRetry={refetch} />;

    return (
        <View style={styles.container}>
            <GroupSummary />
            <CommunityFeed />
            <NotificationCenter />
        </View>
    );
};

export default StudyGroupSection;