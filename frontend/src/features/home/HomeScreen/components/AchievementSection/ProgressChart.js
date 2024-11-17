// features/home/components/AchievementSection/ProgressChart.js
import React from 'react';
import { View, Text } from 'react-native';
import { useAchievements } from '../../../hooks/useAchievements';
import CircularProgress from '../../../../../components/common/CircularProgress';
import styles from './styles';

const ProgressChart = () => {
    const { progress } = useAchievements();

    return (
        <View style={styles.chartSection}>
            <Text style={styles.title}>학습 진행도</Text>
            <View style={styles.chartContainer}>
                <CircularProgress
                    percentage={progress.total}
                    size={120}
                    strokeWidth={12}
                    progressColor="#007AFF"
                />
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>오늘의 목표</Text>
                        <Text style={styles.statValue}>{progress.daily}%</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>주간 목표</Text>
                        <Text style={styles.statValue}>{progress.weekly}%</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default ProgressChart;