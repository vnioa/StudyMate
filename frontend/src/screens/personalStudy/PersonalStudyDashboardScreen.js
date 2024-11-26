import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
    RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { LineChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { studyAPI } from '../../services/api';

const PersonalStudyDashboardScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [dashboardData, setDashboardData] = useState({
        todayStats: {
            completedLectures: 0,
            studyTime: 0,
            quizScore: 0
        },
        level: {
            current: 0,
            nextLevelXp: 0
        },
        streak: {
            current: 0,
            best: 0
        },
        schedule: [],
        goals: [],
        weeklyStats: [],
        growthRate: 0
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await studyAPI.getDashboardData();
            setDashboardData(response.data);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const renderSummaryCard = () => (
        <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>오늘의 학습 요약</Text>
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>완료한 강의</Text>
                    <Text style={styles.statValue}>{dashboardData.todayStats.completedLectures}개</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>학습 시간</Text>
                    <Text style={styles.statValue}>{dashboardData.todayStats.studyTime}분</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>퀴즈 점수</Text>
                    <Text style={styles.statValue}>{dashboardData.todayStats.quizScore}점</Text>
                </View>
            </View>
        </View>
    );

    const renderProgressCard = () => (
        <View style={styles.progressCard}>
            <View style={styles.levelSection}>
                <Text style={styles.levelTitle}>현재 레벨</Text>
                <View style={styles.levelValueContainer}>
                    <Text style={styles.levelValue}>{dashboardData.level.current}</Text>
                    <Text style={styles.levelUnit}>레벨</Text>
                </View>
                <View style={styles.progressBar}>
                    <View style={[styles.progress, { width: `${dashboardData.level.progress}%` }]} />
                </View>
                <Text style={styles.levelSubtext}>다음 레벨까지 {dashboardData.level.nextLevelXp}XP</Text>
            </View>
            <View style={styles.streakSection}>
                <Text style={styles.streakTitle}>연속 학습</Text>
                <View style={styles.streakValueContainer}>
                    <Text style={styles.streakValue}>{dashboardData.streak.current}</Text>
                    <Text style={styles.streakUnit}>일</Text>
                </View>
                <Text style={styles.streakSubtext}>최고 기록 {dashboardData.streak.best}일</Text>
            </View>
        </View>
    );

    const renderScheduleCard = () => (
        <Pressable
            style={styles.scheduleCard}
            onPress={() => navigation.navigate('Schedule')}
        >
            <View style={styles.scheduleHeader}>
                <Text style={styles.sectionTitle}>학습 일정</Text>
                <Icon name="chevron-right" size={20} color="#666" />
            </View>
            <View style={styles.timeSection}>
                {dashboardData.schedule.map((item, index) => (
                    <View key={index} style={styles.timeItem}>
                        <View>
                            <Text style={styles.timeLabel}>{item.subject}</Text>
                            <Text style={styles.timeValue}>{item.time}</Text>
                        </View>
                    </View>
                ))}
            </View>
            <View style={styles.goalsContainer}>
                <View style={styles.goalHeader}>
                    <Text style={styles.goalTitle}>주간 목표</Text>
                </View>
                <View style={styles.goalsList}>
                    {dashboardData.goals.map((goal, index) => (
                        <View key={index} style={styles.goalItem}>
                            <View style={[styles.goalCheckbox, goal.completed && styles.goalComplete]}>
                                {goal.completed && <Icon name="check" size={16} color="#4CAF50" />}
                            </View>
                            <Text style={styles.goalText}>{goal.title}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </Pressable>
    );

    const renderStatisticsCard = () => (
        <Pressable
            style={styles.chartContainer}
            onPress={() => navigation.navigate('StudyAnalytics')}
        >
            <View style={styles.chartSection}>
                <Text style={styles.sectionTitle}>주간 학습 통계</Text>
                <LineChart
                    data={{
                        labels: dashboardData.weeklyStats.map(stat => stat.date),
                        datasets: [{
                            data: dashboardData.weeklyStats.map(stat => stat.studyTime)
                        }]
                    }}
                    width={350}
                    height={180}
                    chartConfig={{
                        backgroundColor: '#fff',
                        backgroundGradientFrom: '#fff',
                        backgroundGradientTo: '#fff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                        style: { borderRadius: 16 }
                    }}
                    bezier
                    style={styles.chart}
                />
            </View>
            <View style={styles.growthSection}>
                <Text style={styles.growthText}>학습 성장률</Text>
                <Text style={styles.growthValue}>+{dashboardData.growthRate}%</Text>
                <Text style={styles.growthSubtext}>지난 30일 대비</Text>
            </View>
        </Pressable>
    );

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={loading}
                    onRefresh={fetchDashboardData}
                />
            }
        >
            <View style={styles.header}>
                <Pressable onPress={() => navigation.openDrawer()}>
                    <Icon name="menu" size={24} color="#333" />
                </Pressable>
                <Text style={styles.headerTitle}>학습 대시보드</Text>
                <View style={{ width: 24 }} />
            </View>

            {renderSummaryCard()}
            {renderProgressCard()}
            {renderScheduleCard()}
            {renderStatisticsCard()}
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

export default PersonalStudyDashboardScreen;