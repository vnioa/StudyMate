// src/screens/study/StudyStatsScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    RefreshControl,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { theme } from '../../utils/styles';
import { date } from '../../utils/helpers';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function StudyStatsScreen() {
    const navigation = useNavigation();

    // 상태 관리
    const [stats, setStats] = useState({
        summary: {
            totalStudyTime: 0,
            averageStudyTime: 0,
            totalQuizzes: 0,
            averageScore: 0,
            streak: 0,
            bestStreak: 0
        },
        subjects: [],
        weeklyData: [],
        monthlyData: [],
        quizResults: [],
        studyHabits: {
            timeDistribution: [],
            dayDistribution: []
        }
    });
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, year
    const [selectedMetric, setSelectedMetric] = useState('time'); // time, score

    // 데이터 로드
    useEffect(() => {
        loadStats();
    }, [selectedPeriod]);

    const loadStats = async () => {
        try {
            setIsLoading(true);
            const response = await api.study.getStats({
                period: selectedPeriod,
                metric: selectedMetric
            });
            setStats(response);
        } catch (error) {
            console.error('Failed to load study stats:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // 차트 데이터 포맷
    const formatChartData = () => {
        const timeData = {
            labels: selectedPeriod === 'week'
                ? stats.weeklyData.map(d => d.day)
                : stats.monthlyData.map(d => d.week),
            datasets: [{
                data: selectedPeriod === 'week'
                    ? stats.weeklyData.map(d => d.studyTime / 3600)
                    : stats.monthlyData.map(d => d.studyTime / 3600),
                color: (opacity = 1) => theme.colors.primary.main,
                strokeWidth: 2
            }]
        };

        const subjectData = stats.subjects.map(subject => ({
            name: subject.name,
            population: subject.percentage,
            color: subject.color,
            legendFontColor: theme.colors.text.primary,
            legendFontSize: 12
        }));

        const habitData = {
            labels: stats.studyHabits.timeDistribution.map(d => d.hour),
            datasets: [{
                data: stats.studyHabits.timeDistribution.map(d => d.percentage)
            }]
        };

        return { timeData, subjectData, habitData };
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
        );
    }

    const { timeData, subjectData, habitData } = formatChartData();

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                        setRefreshing(true);
                        loadStats();
                    }}
                    colors={[theme.colors.primary.main]}
                />
            }
        >
            {/* 요약 통계 */}
            <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>
                            {date.formatDuration(stats.summary.totalStudyTime)}
                        </Text>
                        <Text style={styles.summaryLabel}>총 학습시간</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>
                            {date.formatDuration(stats.summary.averageStudyTime)}
                        </Text>
                        <Text style={styles.summaryLabel}>평균 학습시간</Text>
                    </View>
                </View>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>
                            {stats.summary.totalQuizzes}개
                        </Text>
                        <Text style={styles.summaryLabel}>완료한 퀴즈</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>
                            {stats.summary.averageScore}점
                        </Text>
                        <Text style={styles.summaryLabel}>평균 점수</Text>
                    </View>
                </View>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>
                            {stats.summary.streak}일
                        </Text>
                        <Text style={styles.summaryLabel}>현재 연속 학습</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>
                            {stats.summary.bestStreak}일
                        </Text>
                        <Text style={styles.summaryLabel}>최고 연속 학습</Text>
                    </View>
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

            {/* 학습 시간 추이 */}
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>학습 시간 추이</Text>
                <LineChart
                    data={timeData}
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

            {/* 과목별 분포 */}
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>과목별 분포</Text>
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

            {/* 시간대별 학습 패턴 */}
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>시간대별 학습 패턴</Text>
                <BarChart
                    data={habitData}
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
                    }}
                    style={styles.chart}
                />
            </View>

            {/* 퀴즈 결과 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>퀴즈 결과</Text>
                {stats.quizResults.map((quiz, index) => (
                    <View key={index} style={styles.quizItem}>
                        <View style={styles.quizInfo}>
                            <Text style={styles.quizTitle}>{quiz.title}</Text>
                            <Text style={styles.quizDate}>
                                {date.format(quiz.date, 'YYYY.MM.DD')}
                            </Text>
                        </View>
                        <View style={styles.quizScore}>
                            <Text style={styles.quizScoreText}>{quiz.score}점</Text>
                            <Text style={styles.quizScoreLabel}>
                                {quiz.correctAnswers}/{quiz.totalQuestions}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

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
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background.secondary,
        marginBottom: theme.spacing.lg,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: theme.typography.size.h3,
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
        padding: theme.spacing.lg,
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
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
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
    sectionTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    quizItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        marginBottom: theme.spacing.sm,
    },
    quizInfo: {
        flex: 1,
    },
    quizTitle: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    quizDate: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    quizScore: {
        alignItems: 'center',
    },
    quizScoreText: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.primary.main,
    },
    quizScoreLabel: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    }
});