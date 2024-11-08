// src/screens/home/HomeScreen.js

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useApp } from '../../contexts/AppContext';
import api from '../../services/api';
import { theme } from '../../utils/styles';
import { date, number } from '../../utils/helpers';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const navigation = useNavigation();
    const { state } = useApp();
    const { user } = state.auth;

    // 상태 관리
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardData, setDashboardData] = useState({
        todayStudy: {
            totalTime: 0,
            completedTasks: 0,
            remainingTasks: 0
        },
        weeklyProgress: {
            current: 0,
            target: 0,
            dailyData: []
        },
        recentActivities: [],
        upcomingEvents: [],
        recommendations: []
    });
    const [notificationCount, setNotificationCount] = useState(0);

    // 애니메이션 값
    const progressAnimation = new Animated.Value(0);

    // 데이터 로딩
    const loadDashboardData = async () => {
        try {
            setIsLoading(true);
            const response = await api.home.getDashboard();
            setDashboardData(response);

            // 알림 카운트 업데이트
            const notifications = await api.home.getNotifications();
            setNotificationCount(notifications.filter(n => !n.isRead).length);

            // 진행률 애니메이션
            Animated.timing(progressAnimation, {
                toValue: response.weeklyProgress.current / response.weeklyProgress.target,
                duration: 1000,
                useNativeDriver: false
            }).start();
        } catch (error) {
            console.error('Dashboard loading error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 새로고침
    const handleRefresh = async () => {
        setRefreshing(true);
        await loadDashboardData();
        setRefreshing(false);
    };

    // 초기 로딩
    useEffect(() => {
        loadDashboardData();
    }, []);

    // 헤더 컴포넌트
    const Header = () => (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <Text style={styles.greeting}>안녕하세요</Text>
                <Text style={styles.userName}>{user?.name}님!</Text>
            </View>
            <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => navigation.navigate('Notification')}
            >
                <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
                {notificationCount > 0 && (
                    <View style={styles.notificationBadge}>
                        <Text style={styles.notificationCount}>
                            {notificationCount > 99 ? '99+' : notificationCount}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );

    // 학습 요약 컴포넌트
    const StudySummary = () => (
        <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>오늘의 학습</Text>
                <TouchableOpacity onPress={() => navigation.navigate('StudyTab', { screen: 'StudyStats' })}>
                    <Text style={styles.seeMore}>더보기</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.summaryContent}>
                <View style={styles.summaryItem}>
                    <Ionicons name="time-outline" size={24} color={theme.colors.primary.main} />
                    <Text style={styles.summaryValue}>
                        {date.formatStudyTime(dashboardData.todayStudy.totalTime)}
                    </Text>
                    <Text style={styles.summaryLabel}>총 학습시간</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Ionicons name="checkmark-circle-outline" size={24} color={theme.colors.status.success} />
                    <Text style={styles.summaryValue}>{dashboardData.todayStudy.completedTasks}개</Text>
                    <Text style={styles.summaryLabel}>완료한 과제</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Ionicons name="list-outline" size={24} color={theme.colors.status.warning} />
                    <Text style={styles.summaryValue}>{dashboardData.todayStudy.remainingTasks}개</Text>
                    <Text style={styles.summaryLabel}>남은 과제</Text>
                </View>
            </View>
        </View>
    );

    // 퀵 액세스 컴포넌트
    const QuickAccess = () => {
        const items = [
            {
                icon: 'book-outline',
                label: '개인 학습',
                onPress: () => navigation.navigate('StudyTab', { screen: 'PersonalStudy' })
            },
            {
                icon: 'people-outline',
                label: '그룹 학습',
                onPress: () => navigation.navigate('StudyTab', { screen: 'GroupStudy' })
            },
            {
                icon: 'help-circle-outline',
                label: '퀴즈',
                onPress: () => navigation.navigate('StudyTab', { screen: 'Quiz' })
            },
            {
                icon: 'document-text-outline',
                label: '학습 자료',
                onPress: () => navigation.navigate('StudyTab', { screen: 'StudyMaterial' })
            }
        ];

        return (
            <View style={styles.quickAccess}>
                {items.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.quickAccessItem}
                        onPress={item.onPress}
                    >
                        <View style={styles.quickAccessIcon}>
                            <Ionicons name={item.icon} size={24} color={theme.colors.primary.main} />
                        </View>
                        <Text style={styles.quickAccessLabel}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    // 주간 진행률 컴포넌트
    const WeeklyProgress = () => (
        <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>주간 학습 진행률</Text>
            <View style={styles.progressBar}>
                <Animated.View
                    style={[
                        styles.progressFill,
                        {
                            width: progressAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%']
                            })
                        }
                    ]}
                />
            </View>
            <View style={styles.progressInfo}>
                <Text style={styles.progressText}>
                    {number.formatNumber(dashboardData.weeklyProgress.current)}분 /
                    {number.formatNumber(dashboardData.weeklyProgress.target)}분
                </Text>
                <Text style={styles.progressPercent}>
                    {Math.round((dashboardData.weeklyProgress.current / dashboardData.weeklyProgress.target) * 100)}%
                </Text>
            </View>
            <LineChart
                data={{
                    labels: ['월', '화', '수', '목', '금', '토', '일'],
                    datasets: [{
                        data: dashboardData.weeklyProgress.dailyData
                    }]
                }}
                width={width - 48}
                height={180}
                chartConfig={{
                    backgroundColor: theme.colors.background.primary,
                    backgroundGradientFrom: theme.colors.background.primary,
                    backgroundGradientTo: theme.colors.background.primary,
                    decimalPlaces: 0,
                    color: (opacity = 1) => theme.colors.primary.main,
                    style: {
                        borderRadius: 16
                    }
                }}
                bezier
                style={styles.chart}
            />
        </View>
    );

    // 예정된 일정 컴포넌트
    const UpcomingEvents = () => (
        <View style={styles.eventsCard}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>예정된 일정</Text>
                <TouchableOpacity>
                    <Text style={styles.seeMore}>전체보기</Text>
                </TouchableOpacity>
            </View>
            {dashboardData.upcomingEvents.map((event, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.eventItem}
                    onPress={() => {
                        if (event.type === 'group') {
                            navigation.navigate('GroupTab', {
                                screen: 'GroupDetail',
                                params: { groupId: event.groupId }
                            });
                        } else if (event.type === 'study') {
                            navigation.navigate('StudyTab', {
                                screen: 'PersonalStudy',
                                params: { sessionId: event.sessionId }
                            });
                        }
                    }}
                >
                    <View style={styles.eventIcon}>
                        <Ionicons
                            name={event.type === 'group' ? 'people-outline' : 'book-outline'}
                            size={24}
                            color={theme.colors.primary.main}
                        />
                    </View>
                    <View style={styles.eventInfo}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <Text style={styles.eventTime}>{date.formatRelative(event.startTime)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <Header />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[theme.colors.primary.main]}
                    />
                }
            >
                <StudySummary />
                <QuickAccess />
                <WeeklyProgress />
                <UpcomingEvents />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    scrollView: {
        flex: 1,
    },

    // 헤더 스타일
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: theme.colors.background.primary,
    },
    headerLeft: {
        flex: 1,
    },
    greeting: {
        fontSize: 16,
        color: theme.colors.text.secondary,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    notificationButton: {
        position: 'relative',
        padding: 8,
    },
    notificationBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: theme.colors.status.error,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationCount: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },

    // 학습 요약 스타일
    summaryCard: {
        margin: 20,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 16,
        ...theme.shadows.medium,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    summaryContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginTop: 8,
    },
    summaryLabel: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 4,
    },
    summaryDivider: {
        width: 1,
        height: 40,
        backgroundColor: theme.colors.border,
    },

    // 퀵 액세스 스타일
    quickAccess: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
        marginHorizontal: 10,
    },
    quickAccessItem: {
        width: '25%',
        alignItems: 'center',
        padding: 10,
    },
    quickAccessIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.primary.main + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickAccessLabel: {
        fontSize: 12,
        color: theme.colors.text.primary,
        textAlign: 'center',
    },

    // 진행률 스타일
    progressCard: {
        margin: 20,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 16,
        ...theme.shadows.medium,
    },
    progressTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginBottom: 16,
    },
    progressBar: {
        height: 8,
        backgroundColor: theme.colors.grey[200],
        borderRadius: 4,
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.primary.main,
        borderRadius: 4,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    progressText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    progressPercent: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.primary.main,
    },
    chart: {
        marginTop: 16,
        borderRadius: 16,
    },

    // 이벤트 스타일
    eventsCard: {
        margin: 20,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 16,
        ...theme.shadows.medium,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    eventItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    eventIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary.main + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    eventInfo: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 16,
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    eventTime: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },

    // 공통 스타일
    seeMore: {
        fontSize: 14,
        color: theme.colors.primary.main,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: 20,
    },
    shadow: {
        ...theme.shadows.medium,
    }
});