// screens/Study/StudyDashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';


const DashboardScreen = () => {
    const [studyData, setStudyData] = useState({
        todaySummary: {},
        weeklyStats: [],
        monthlyStats: [],
        upcomingTasks: [],
        streak: 0,
        badges: [],
        level: 1
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/study/dashboard');
            setStudyData(response.data);
        } catch (error) {
            console.error('대시보드 데이터 로딩 실패:', error);
        }
    };

    const renderTodaySummary = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>오늘의 학습</Text>
            <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{studyData.todaySummary.totalTime}분</Text>
                    <Text style={styles.summaryLabel}>총 학습시간</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{studyData.todaySummary.completedTasks}</Text>
                    <Text style={styles.summaryLabel}>완료한 과제</Text>
                </View>
            </View>
        </View>
    );

    const renderStatistics = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>학습 통계</Text>
            <LineChart
                data={{
                    labels: studyData.weeklyStats.map(stat => stat.date),
                    datasets: [{
                        data: studyData.weeklyStats.map(stat => stat.studyTime)
                    }]
                }}
                width={350}
                height={200}
                chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                }}
                style={styles.chart}
            />
        </View>
    );

    const renderUpcomingTasks = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>다가오는 일정</Text>
            {studyData.upcomingTasks.map((task, index) => (
                <View key={index} style={styles.taskItem}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskDate}>{formatDate(task.dueDate)}</Text>
                </View>
            ))}
        </View>
    );

    const renderStreak = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>학습 스트릭</Text>
            <View style={styles.streakContainer}>
                <Text style={styles.streakCount}>{studyData.streak}일</Text>
                <Text style={styles.streakLabel}>연속 학습 중</Text>
            </View>
        </View>
    );

    const renderBadges = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>획득한 뱃지</Text>
            <View style={styles.badgesContainer}>
                {studyData.badges.map((badge, index) => (
                    <TouchableOpacity key={index} style={styles.badge}>
                        <Text style={styles.badgeTitle}>{badge.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            {renderTodaySummary()}
            {renderStatistics()}
            {renderUpcomingTasks()}
            {renderStreak()}
            {renderBadges()}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    section: {
        backgroundColor: '#ffffff',
        margin: 10,
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    taskItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    taskDate: {
        fontSize: 14,
        color: '#666',
    },
    streakContainer: {
        alignItems: 'center',
    },
    streakCount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    streakLabel: {
        fontSize: 16,
        color: '#666',
    },
    badgesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
    },
    badge: {
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 20,
        margin: 5,
    },
    badgeTitle: {
        fontSize: 14,
        color: '#333',
    },
});

export default DashboardScreen;