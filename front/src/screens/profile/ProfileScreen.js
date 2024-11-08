// src/screens/profile/ProfileScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    Platform,
    RefreshControl,
    Animated,
    Share,
    Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { theme } from '../../utils/styles';
import { date } from '../../utils/helpers';
import { Avatar } from '../../components/UI';
import api from '../../services/api';

const { width } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 250;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

export default function ProfileScreen() {
    const navigation = useNavigation();
    const scrollY = new Animated.Value(0);

    // 상태 관리
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({
        studyTime: 0,
        completedTasks: 0,
        accuracy: 0,
        streak: 0
    });
    const [activities, setActivities] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, year

    // 헤더 애니메이션 값
    const headerHeight = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE],
        outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
        extrapolate: 'clamp'
    });

    const headerTitleOpacity = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
        outputRange: [0, 0, 1],
        extrapolate: 'clamp'
    });

    const headerImageOpacity = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
        outputRange: [1, 0.5, 0],
        extrapolate: 'clamp'
    });

    // 데이터 로드
    useEffect(() => {
        loadProfileData();
    }, [selectedPeriod]);

    const loadProfileData = async (showLoading = true) => {
        try {
            if (showLoading) setIsLoading(true);

            const [profileData, statsData, activitiesData, achievementsData] = await Promise.all([
                api.profile.getProfile(),
                api.profile.getStats(selectedPeriod),
                api.profile.getActivities(selectedPeriod),
                api.profile.getAchievements()
            ]);

            setProfile(profileData);
            setStats(statsData);
            setActivities(activitiesData);
            setAchievements(achievementsData);
        } catch (error) {
            console.error('Failed to load profile data:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // 프로필 공유
    const handleShare = async () => {
        try {
            const result = await Share.share({
                message: `${profile.name}님의 StudyMate 프로필입니다.`,
                url: `studymate://profile/${profile.id}`
            });

            if (result.action === Share.sharedAction) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    // 차트 데이터 포맷
    const formatChartData = () => {
        const studyData = {
            labels: activities.map(activity => activity.date),
            datasets: [{
                data: activities.map(activity => activity.studyTime),
                color: (opacity = 1) => theme.colors.primary.main,
                strokeWidth: 2
            }]
        };

        const subjectData = profile?.subjects.map(subject => ({
            name: subject.name,
            population: subject.progress,
            color: subject.color,
            legendFontColor: theme.colors.text.primary,
            legendFontSize: 12
        }));

        return { studyData, subjectData };
    };

    if (isLoading || !profile) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
        );
    }

    const { studyData, subjectData } = formatChartData();

    return (
        <View style={styles.container}>
            <Animated.ScrollView
                contentContainerStyle={styles.scrollContent}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            loadProfileData(false);
                        }}
                        colors={[theme.colors.primary.main]}
                    />
                }
            >
                {/* 프로필 정보 */}
                <View style={styles.profileInfo}>
                    <Avatar
                        source={{ uri: profile.avatar }}
                        size="large"
                        style={styles.avatar}
                    />
                    <Text style={styles.name}>{profile.name}</Text>
                    {profile.statusMessage && (
                        <Text style={styles.statusMessage}>{profile.statusMessage}</Text>
                    )}
                    <View style={styles.badges}>
                        {profile.badges.map((badge, index) => (
                            <View key={index} style={styles.badge}>
                                <Ionicons name={badge.icon} size={16} color={badge.color} />
                                <Text style={styles.badgeText}>{badge.name}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* 학습 통계 */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {date.formatDuration(stats.studyTime)}
                        </Text>
                        <Text style={styles.statLabel}>총 학습시간</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.completedTasks}</Text>
                        <Text style={styles.statLabel}>완료한 과제</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.accuracy}%</Text>
                        <Text style={styles.statLabel}>정답률</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.streak}일</Text>
                        <Text style={styles.statLabel}>연속 학습</Text>
                    </View>
                </View>

                {/* 기간 선택 */}
                <View style={styles.periodSelector}>
                    <TouchableOpacity
                        style={[
                            styles.periodButton,
                            selectedPeriod === 'week' && styles.periodButtonActive
                        ]}
                        onPress={() => setSelectedPeriod('week')}
                    >
                        <Text style={[
                            styles.periodButtonText,
                            selectedPeriod === 'week' && styles.periodButtonTextActive
                        ]}>
                            주간
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.periodButton,
                            selectedPeriod === 'month' && styles.periodButtonActive
                        ]}
                        onPress={() => setSelectedPeriod('month')}
                    >
                        <Text style={[
                            styles.periodButtonText,
                            selectedPeriod === 'month' && styles.periodButtonTextActive
                        ]}>
                            월간
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.periodButton,
                            selectedPeriod === 'year' && styles.periodButtonActive
                        ]}
                        onPress={() => setSelectedPeriod('year')}
                    >
                        <Text style={[
                            styles.periodButtonText,
                            selectedPeriod === 'year' && styles.periodButtonTextActive
                        ]}>
                            연간
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 학습 추이 차트 */}
                <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>학습 추이</Text>
                    <LineChart
                        data={studyData}
                        width={width - 32}
                        height={220}
                        chartConfig={{
                            backgroundColor: theme.colors.background.primary,
                            backgroundGradientFrom: theme.colors.background.primary,
                            backgroundGradientTo: theme.colors.background.primary,
                            decimalPlaces: 1,
                            color: (opacity = 1) => theme.colors.primary.main,
                            labelColor: (opacity = 1) => theme.colors.text.secondary,
                            style: {
                                borderRadius: 16
                            },
                            propsForDots: {
                                r: '6',
                                strokeWidth: '2',
                                stroke: theme.colors.primary.main
                            }
                        }}
                        bezier
                        style={styles.chart}
                    />
                </View>

                {/* 과목별 진도 차트 */}
                <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>과목별 진도</Text>
                    <PieChart
                        data={subjectData}
                        width={width - 32}
                        height={220}
                        chartConfig={{
                            color: (opacity = 1) => theme.colors.text.primary,
                        }}
                        accessor="population"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        absolute
                    />
                </View>

                {/* 최근 활동 */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>최근 활동</Text>
                        <TouchableOpacity
                            style={styles.sectionButton}
                            onPress={() => navigation.navigate('ActivityHistory')}
                        >
                            <Text style={styles.sectionButtonText}>전체보기</Text>
                        </TouchableOpacity>
                    </View>
                    {activities.slice(0, 5).map((activity, index) => (
                        <View key={index} style={styles.activityItem}>
                            <View style={styles.activityIcon}>
                                <Ionicons
                                    name={getActivityIcon(activity.type)}
                                    size={24}
                                    color={theme.colors.primary.main}
                                />
                            </View>
                            <View style={styles.activityInfo}>
                                <Text style={styles.activityTitle}>{activity.title}</Text>
                                <Text style={styles.activityTime}>
                                    {date.formatRelative(activity.timestamp)}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* 업적 */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>업적</Text>
                        <TouchableOpacity
                            style={styles.sectionButton}
                            onPress={() => navigation.navigate('Achievements')}
                        >
                            <Text style={styles.sectionButtonText}>전체보기</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.achievementsContainer}
                    >
                        {achievements.slice(0, 5).map((achievement, index) => (
                            <View key={index} style={styles.achievementItem}>
                                <View style={[
                                    styles.achievementIcon,
                                    { backgroundColor: achievement.color + '20' }
                                ]}>
                                    <Ionicons
                                        name={achievement.icon}
                                        size={32}
                                        color={achievement.color}
                                    />
                                </View>
                                <Text style={styles.achievementName}>{achievement.name}</Text>
                                <Text style={styles.achievementProgress}>
                                    {achievement.progress}%
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* 포트폴리오 */}
                <TouchableOpacity
                    style={styles.portfolioButton}
                    onPress={() => navigation.navigate('Portfolio')}
                >
                    <Ionicons
                        name="document-text-outline"
                        size={24}
                        color={theme.colors.primary.main}
                    />
                    <Text style={styles.portfolioButtonText}>포트폴리오 보기</Text>
                    <Ionicons
                        name="chevron-forward"
                        size={24}
                        color={theme.colors.text.secondary}
                    />
                </TouchableOpacity>
            </Animated.ScrollView>

            {/* 헤더 이미지 */}
            <Animated.Image
                source={{ uri: profile.coverImage }}
                style={[
                    styles.headerImage,
                    {
                        height: headerHeight,
                        opacity: headerImageOpacity
                    }
                ]}
            />

            {/* 헤더 버튼 */}
            <View style={styles.headerButtons}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => navigation.navigate('EditProfile')}
                >
                    <Ionicons name="create-outline" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => navigation.navigate('Settings')}
                >
                    <Ionicons name="settings-outline" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleShare}
                >
                    <Ionicons name="share-outline" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

// 활동 타입별 아이콘
const getActivityIcon = (type) => {
    switch (type) {
        case 'study':
            return 'book-outline';
        case 'quiz':
            return 'help-circle-outline';
        case 'achievement':
            return 'trophy-outline';
        case 'group':
            return 'people-outline';
        default:
            return 'ellipsis-horizontal-outline';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingTop: HEADER_MAX_HEIGHT,
    },
    headerImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.grey[200],
    },
    headerButtons: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 44 : 0,
        right: 0,
        flexDirection: 'row',
        padding: theme.spacing.md,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: theme.spacing.sm,
    },
    profileInfo: {
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    avatar: {
        marginBottom: theme.spacing.md,
    },
    name: {
        fontSize: theme.typography.size.h3,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    statusMessage: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    badges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: theme.spacing.sm,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        paddingVertical: 4,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: 12,
        gap: 4,
    },
    badgeText: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.secondary,
    },
    statsContainer: {
        flexDirection: 'row',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        margin: theme.spacing.lg,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.primary.main,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    periodSelector: {
        flexDirection: 'row',
        padding: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    periodButton: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
        backgroundColor: theme.colors.background.secondary,
        alignItems: 'center',
    },
    periodButtonActive: {
        backgroundColor: theme.colors.primary.main,
    },
    periodButtonText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.secondary,
    },
    periodButtonTextActive: {
        color: theme.colors.text.contrast,
    },
    chartContainer: {
        padding: theme.spacing.lg,
    },
    chartTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    chart: {
        marginVertical: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
    },
    section: {
        padding: theme.spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    sectionButton: {
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.sm,
    },
    sectionButtonText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.primary.main,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        marginBottom: theme.spacing.sm,
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary.main + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    activityInfo: {
        flex: 1,
    },
    activityTitle: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    activityTime: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    achievementsContainer: {
        paddingRight: theme.spacing.lg,
    },
    achievementItem: {
        alignItems: 'center',
        marginRight: theme.spacing.md,
        width: 100,
    },
    achievementIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    achievementName: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: 2,
    },
    achievementProgress: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    portfolioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background.secondary,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        borderRadius: theme.layout.components.borderRadius,
    },
    portfolioButtonText: {
        flex: 1,
        marginLeft: theme.spacing.md,
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    }
});