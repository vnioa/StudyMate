import React, {useState, useCallback, memo, useEffect} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
    RefreshControl,
    Platform,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { studyAPI } from '../../services/api';
import { theme } from '../../styles/theme';

const SummaryCard = memo(({ stats }) => (
    <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>오늘의 학습 요약</Text>
        <View style={styles.statsRow}>
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>완료한 강의</Text>
                <Text style={styles.statValue}>{stats.completedLectures}개</Text>
            </View>
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>학습 시간</Text>
                <Text style={styles.statValue}>{stats.studyTime}분</Text>
            </View>
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>퀴즈 점수</Text>
                <Text style={styles.statValue}>{stats.quizScore}점</Text>
            </View>
        </View>
    </View>
));

const ProgressCard = memo(({ level, streak }) => (
    <View style={styles.progressCard}>
        <View style={styles.levelSection}>
            <Text style={styles.levelTitle}>현재 레벨</Text>
            <View style={styles.levelValueContainer}>
                <Text style={styles.levelValue}>{level.current}</Text>
                <Text style={styles.levelUnit}>레벨</Text>
            </View>
            <View style={styles.progressBar}>
                <View style={[
                    styles.progress,
                    { width: `${level.progress}%` }
                ]} />
            </View>
            <Text style={styles.levelSubtext}>
                다음 레벨까지 {level.nextLevelXp}XP
            </Text>
        </View>
        <View style={styles.streakSection}>
            <Text style={styles.streakTitle}>연속 학습</Text>
            <View style={styles.streakValueContainer}>
                <Text style={styles.streakValue}>{streak.current}</Text>
                <Text style={styles.streakUnit}>일</Text>
            </View>
            <Text style={styles.streakSubtext}>
                최고 기록 {streak.best}일
            </Text>
        </View>
    </View>
));

const ScheduleCard = memo(({ schedule, goals, onPress }) => (
    <Pressable style={styles.scheduleCard} onPress={onPress}>
        <View style={styles.scheduleHeader}>
            <Text style={styles.sectionTitle}>학습 일정</Text>
            <Icon
                name="chevron-right"
                size={20}
                color={theme.colors.textSecondary}
            />
        </View>
        <View style={styles.timeSection}>
            {schedule.map((item, index) => (
                <View key={index} style={styles.timeItem}>
                    <Text style={styles.timeLabel}>{item.subject}</Text>
                    <Text style={styles.timeValue}>{item.time}</Text>
                </View>
            ))}
        </View>
        <View style={styles.goalsContainer}>
            <Text style={styles.goalTitle}>주간 목표</Text>
            <View style={styles.goalsList}>
                {goals.map((goal, index) => (
                    <View key={index} style={styles.goalItem}>
                        <View style={[
                            styles.goalCheckbox,
                            goal.completed && styles.goalComplete
                        ]}>
                            {goal.completed && (
                                <Icon
                                    name="check"
                                    size={16}
                                    color={theme.colors.success}
                                />
                            )}
                        </View>
                        <Text style={styles.goalText}>{goal.title}</Text>
                    </View>
                ))}
            </View>
        </View>
    </Pressable>
));

const StatisticsCard = memo(({ weeklyStats, growthRate, onPress }) => {
    const [chartData, setChartData] = useState({
        labels: ['월', '화', '수', '목', '금', '토', '일'],
        datasets: [{data: [0, 0, 0, 0, 0, 0, 0]}]
    });

    useEffect(() => {
        if(weeklyStats?.length > 0){
            setChartData({
                labels: ['월', '화', '수', '목', '금', '토', '일'],
                datasets: [{
                    data: weeklyStats.map(stat => {
                        const value = Number(stat.studyTime);
                        return (isFinite(value) && value >= 0) ? Math.min(value, 1440) : 0;
                    })
                }]
            })
        }
    })

    return (
        <Pressable style={styles.chartContainer} onPress={onPress}>
            <View style={styles.chartSection}>
                <Text style={styles.sectionTitle}>주간 학습 통계</Text>
                <LineChart
                    data={chartData}
                    width={350}
                    height={180}
                    chartConfig={{
                        backgroundColor: '#ffffff',
                        backgroundGradientFrom: '#ffffff',
                        backgroundGradientTo: '#ffffff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`
                    }}
                    bezier
                    style={{
                        marginVertical: 8,
                        borderRadius: 16
                    }}
                />
            </View>
            <View style={styles.growthSection}>
                <Text style={styles.growthText}>학습 성장률</Text>
                <Text style={styles.growthValue}>+{growthRate}%</Text>
                <Text style={styles.growthSubtext}>지난 30일 대비</Text>
            </View>
        </Pressable>
    );
});

const PersonalStudyDashboardScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardData, setDashboardData] = useState({
        todayStats: {
            completedLectures: 0,
            studyTime: 0,
            quizScore: 0
        },
        level: {
            current: 0,
            nextLevelXp: 0,
            progress: 0
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

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await studyAPI.getDashboardData();
            if (response.data.success) {
                setDashboardData(response.data.dashboard);
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '데이터를 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchDashboardData();
            return () => {
                setDashboardData({
                    todayStats: {
                        completedLectures: 0,
                        studyTime: 0,
                        quizScore: 0
                    },
                    level: {
                        current: 0,
                        nextLevelXp: 0,
                        progress: 0
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
            };
        }, [fetchDashboardData])
    );

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setRefreshing(false);
    }, [fetchDashboardData]);

    if (loading && !dashboardData.todayStats.studyTime) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={[theme.colors.primary]}
                    tintColor={theme.colors.primary}
                />
            }
        >
            <View style={styles.header}>
                <Pressable
                    onPress={() => navigation.openDrawer()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon
                        name="menu"
                        size={24}
                        color={theme.colors.text}
                    />
                </Pressable>
                <Text style={styles.headerTitle}>학습 대시보드</Text>
                <View style={{ width: 24 }} />
            </View>

            <SummaryCard stats={dashboardData.todayStats} />
            <ProgressCard
                level={dashboardData.level}
                streak={dashboardData.streak}
            />
            <ScheduleCard
                schedule={dashboardData.schedule}
                goals={dashboardData.goals}
                onPress={() => navigation.navigate('Schedule')}
            />
            <StatisticsCard
                weeklyStats={dashboardData.weeklyStats}
                growthRate={dashboardData.growthRate}
                onPress={() => navigation.navigate('StudyAnalytics')}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    headerTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
    },
    summaryCard: {
        backgroundColor: theme.colors.surface,
        margin: theme.spacing.md,
        padding: theme.spacing.lg,
        borderRadius: theme.roundness.medium,
        ...Platform.select({
            ios: theme.shadows.medium,
            android: { elevation: 3 }
        }),
    },
    cardTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    statValue: {
        ...theme.typography.headlineMedium,
        color: theme.colors.primary,
    },
    progressCard: {
        backgroundColor: theme.colors.surface,
        margin: theme.spacing.md,
        padding: theme.spacing.lg,
        borderRadius: theme.roundness.medium,
        ...Platform.select({
            ios: theme.shadows.medium,
            android: { elevation: 3 }
        }),
    },
    levelSection: {
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    levelTitle: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    levelValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    levelValue: {
        ...theme.typography.headlineLarge,
        color: theme.colors.primary,
    },
    levelUnit: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textSecondary,
        marginLeft: theme.spacing.xs,
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.full,
        marginVertical: theme.spacing.sm,
        overflow: 'hidden',
    },
    progress: {
        height: '100%',
        backgroundColor: theme.colors.primary,
    },
    levelSubtext: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    streakSection: {
        alignItems: 'center',
    },
    streakTitle: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    streakValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    streakValue: {
        ...theme.typography.headlineLarge,
        color: theme.colors.primary,
    },
    streakUnit: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textSecondary,
        marginLeft: theme.spacing.xs,
    },
    streakSubtext: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    scheduleCard: {
        backgroundColor: theme.colors.surface,
        margin: theme.spacing.md,
        padding: theme.spacing.lg,
        borderRadius: theme.roundness.medium,
        ...Platform.select({
            ios: theme.shadows.medium,
            android: { elevation: 3 }
        }),
    },
    scheduleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
    },
    timeSection: {
        marginBottom: theme.spacing.lg,
    },
    timeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    timeLabel: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    timeValue: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    goalsContainer: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: theme.spacing.md,
    },
    goalTitle: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    goalsList: {
        gap: theme.spacing.sm,
    },
    goalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    goalCheckbox: {
        width: 24,
        height: 24,
        borderRadius: theme.roundness.small,
        borderWidth: 2,
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    goalComplete: {
        backgroundColor: theme.colors.success,
        borderColor: theme.colors.success,
    },
    goalText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
    },
    chartContainer: {
        backgroundColor: theme.colors.surface,
        margin: theme.spacing.md,
        padding: theme.spacing.lg,
        borderRadius: theme.roundness.medium,
        ...Platform.select({
            ios: theme.shadows.medium,
            android: { elevation: 3 }
        }),
    },
    chart: {
        marginVertical: theme.spacing.md,
        borderRadius: theme.roundness.medium,
    },
    growthSection: {
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: theme.spacing.md,
    },
    growthText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    growthValue: {
        ...theme.typography.headlineLarge,
        color: theme.colors.success,
    },
    growthSubtext: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    chartSection: {
        marginBottom: theme.spacing.lg,
    },
});

export default PersonalStudyDashboardScreen;