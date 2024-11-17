// features/home/components/AchievementSection/StatsDashboard.js
import React from 'react';
import { View, Text } from 'react-native';
import { useAchievements } from '../../../hooks/useAchievements';
import styles from './styles';

const StatsDashboard = () => {
    const { stats } = useAchievements();

    return (
        <View style={styles.dashboardSection}>
            <Text style={styles.title}>학습 통계</Text>
            <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                    <Text style={styles.statBoxValue}>{stats.totalStudyTime}</Text>
                    <Text style={styles.statBoxLabel}>총 학습시간</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statBoxValue}>{stats.completedGoals}</Text>
                    <Text style={styles.statBoxLabel}>완료한 목표</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statBoxValue}>{stats.earnedBadges}</Text>
                    <Text style={styles.statBoxLabel}>획득한 배지</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statBoxValue}>{stats.streak}일</Text>
                    <Text style={styles.statBoxLabel}>연속 학습</Text>
                </View>
            </View>
        </View>
    );
};

export default StatsDashboard;