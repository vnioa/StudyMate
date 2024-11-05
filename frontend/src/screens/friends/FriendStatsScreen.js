// src/screens/friends/FriendStatsScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Platform
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../utils/styles';
import { date, number } from '../../utils/helpers';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function FriendStatsScreen() {
    // 상태 관리
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalFriends: 0,
        onlineFriends: 0,
        studyGroups: 0,
        interactions: [],
        categories: [],
        activityTrend: [],
        recentActivities: []
    });
    const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, year
    const [selectedCategory, setSelectedCategory] = useState('all');

    // 통계 데이터 로드
    useEffect(() => {
        loadStats();
    }, [selectedPeriod]);

    const loadStats = async () => {
        try {
            setIsLoading(true);
            const response = await api.friend.getStats({
                period: selectedPeriod,
                category: selectedCategory
            });
            setStats(response);
        } catch (error) {
            console.error('Failed to load friend stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 차트 데이터 포맷
    const formatChartData = () => {
        // 활동 추세 데이터
        const activityData = {
            labels: stats.activityTrend.map(item => item.label),
            datasets: [{
                data: stats.activityTrend.map(item => item.value)
            }]
        };

        // 카테고리 분포 데이터
        const categoryData = stats.categories.map(category => ({
            name: category.name,
            population: category.count,
            color: category.color,
            legendFontColor: theme.colors.text.primary,
            legendFontSize: 12
        }));

        return { activityData, categoryData };
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
        );
    }

    const { activityData, categoryData } = formatChartData();

    return (
        <ScrollView style={styles.container}>
            {/* 요약 카드 */}
            <View style={styles.summaryContainer}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryValue}>{stats.totalFriends}</Text>
                    <Text style={styles.summaryLabel}>전체 친구</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryValue}>{stats.onlineFriends}</Text>
                    <Text style={styles.summaryLabel}>온라인</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryValue}>{stats.studyGroups}</Text>
                    <Text style={styles.summaryLabel}>함께하는 그룹</Text>
                </View>
            </View>

            {/* 기간 선택 */}
            <View style={styles.periodSelector}>
                <TouchableOpacity
                    style={[
                        styles.periodButton,
                        selectedPeriod === 'week' && styles.periodButtonActive
                    ]}
                    onPress={() => {
                        setSelectedPeriod('week');
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
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
                    onPress={() => {
                        setSelectedPeriod('month');
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
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
                    onPress={() => {
                        setSelectedPeriod('year');
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                >
                    <Text style={[
                        styles.periodButtonText,
                        selectedPeriod === 'year' && styles.periodButtonTextActive
                    ]}>
                        연간
                    </Text>
                </TouchableOpacity>
            </View>

            {/* 활동 추세 차트 */}
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>활동 추세</Text>
                <LineChart
                    data={activityData}
                    width={width - 32}
                    height={220}
                    chartConfig={{
                        backgroundColor: theme.colors.background.primary,
                        backgroundGradientFrom: theme.colors.background.primary,
                        backgroundGradientTo: theme.colors.background.primary,
                        decimalPlaces: 0,
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

            {/* 카테고리 분포 차트 */}
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>친구 분포</Text>
                <PieChart
                    data={categoryData}
                    width={width - 32}
                    height={220}
                    chartConfig={{
                        color: (opacity = 1) => theme.colors.text.primary,
                        labelColor: (opacity = 1) => theme.colors.text.primary,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                />
            </View>

            {/* 최근 활동 */}
            <View style={styles.activityContainer}>
                <Text style={styles.sectionTitle}>최근 활동</Text>
                {stats.recentActivities.map((activity, index) => (
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
        </ScrollView>
    );
}

// 활동 타입별 아이콘
const getActivityIcon = (type) => {
    switch (type) {
        case 'study':
            return 'book-outline';
        case 'chat':
            return 'chatbubble-outline';
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
    summaryContainer: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    summaryCard: {
        flex: 1,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: theme.typography.size.h2,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.primary.main,
        marginBottom: theme.spacing.xs,
    },
    summaryLabel: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    periodSelector: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    periodButton: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
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
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
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
    activityContainer: {
        padding: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
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
    }
});