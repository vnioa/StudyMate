// src/screens/study/StudyMainScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Platform,
    RefreshControl,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LineChart } from 'react-native-chart-kit';
import { theme } from '../../utils/styles';
import { date } from '../../utils/helpers';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function StudyMainScreen() {
    const navigation = useNavigation();

    // 상태 관리
    const [studyData, setStudyData] = useState({
        stats: {
            todayStudyTime: 0,
            weeklyStudyTime: 0,
            monthlyStudyTime: 0,
            totalQuizzes: 0,
            correctRate: 0,
            streak: 0
        },
        recentStudies: [],
        studyMaterials: [],
        recommendedQuizzes: [],
        aiRecommendations: [],
        weeklyProgress: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // 데이터 로드
    useEffect(() => {
        loadStudyData();
    }, []);

    const loadStudyData = async () => {
        try {
            setIsLoading(true);
            const response = await api.study.getStudyData();
            setStudyData(response);
        } catch (error) {
            console.error('Failed to load study data:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // 학습 시작
    const handleStartStudy = (type) => {
        if (type === 'personal') {
            navigation.navigate('PersonalStudy');
        } else {
            navigation.navigate('GroupStudy');
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    // 퀴즈 시작
    const handleStartQuiz = (quizId) => {
        navigation.navigate('Quiz', { quizId });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    // 학습 자료 보기
    const handleViewMaterial = (materialId) => {
        navigation.navigate('StudyMaterial', { materialId });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // AI 추천 학습 시작
    const handleStartAIStudy = (recommendationId) => {
        navigation.navigate('AIRecommend', { recommendationId });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                        setRefreshing(true);
                        loadStudyData();
                    }}
                    colors={[theme.colors.primary.main]}
                />
            }
        >
            {/* 학습 모드 선택 */}
            <View style={styles.modeContainer}>
                <TouchableOpacity
                    style={styles.modeButton}
                    onPress={() => handleStartStudy('personal')}
                >
                    <View style={styles.modeIcon}>
                        <Ionicons name="person" size={32} color={theme.colors.primary.main} />
                    </View>
                    <Text style={styles.modeTitle}>개인 학습</Text>
                    <Text style={styles.modeDescription}>
                        나만의 페이스로 학습을 진행합니다
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.modeButton}
                    onPress={() => handleStartStudy('group')}
                >
                    <View style={styles.modeIcon}>
                        <Ionicons name="people" size={32} color={theme.colors.primary.main} />
                    </View>
                    <Text style={styles.modeTitle}>그룹 학습</Text>
                    <Text style={styles.modeDescription}>
                        함께 학습하고 토론하며 성장합니다
                    </Text>
                </TouchableOpacity>
            </View>

            {/* 학습 통계 */}
            <View style={styles.statsContainer}>
                <View style={styles.statsHeader}>
                    <Text style={styles.statsTitle}>학습 통계</Text>
                    <TouchableOpacity
                        style={styles.statsButton}
                        onPress={() => navigation.navigate('StudyStats')}
                    >
                        <Text style={styles.statsButtonText}>전체보기</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statsItem}>
                        <Text style={styles.statsValue}>
                            {date.formatDuration(studyData.stats.todayStudyTime)}
                        </Text>
                        <Text style={styles.statsLabel}>오늘 학습</Text>
                    </View>
                    <View style={styles.statsItem}>
                        <Text style={styles.statsValue}>
                            {studyData.stats.correctRate}%
                        </Text>
                        <Text style={styles.statsLabel}>정답률</Text>
                    </View>
                    <View style={styles.statsItem}>
                        <Text style={styles.statsValue}>
                            {studyData.stats.streak}일
                        </Text>
                        <Text style={styles.statsLabel}>연속 학습</Text>
                    </View>
                    <View style={styles.statsItem}>
                        <Text style={styles.statsValue}>
                            {studyData.stats.totalQuizzes}개
                        </Text>
                        <Text style={styles.statsLabel}>완료한 퀴즈</Text>
                    </View>
                </View>

                {/* 주간 학습 추이 */}
                <View style={styles.chartContainer}>
                    <LineChart
                        data={{
                            labels: studyData.weeklyProgress.map(item => item.day),
                            datasets: [{
                                data: studyData.weeklyProgress.map(item => item.studyTime / 3600)
                            }]
                        }}
                        width={width - 32}
                        height={180}
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
            </View>

            {/* AI 추천 학습 */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>AI 추천 학습</Text>
                    <TouchableOpacity
                        style={styles.sectionButton}
                        onPress={() => navigation.navigate('AIRecommend')}
                    >
                        <Text style={styles.sectionButtonText}>더보기</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.recommendationsContainer}
                >
                    {studyData.aiRecommendations.map((recommendation, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.recommendationItem}
                            onPress={() => handleStartAIStudy(recommendation.id)}
                        >
                            <View style={styles.recommendationIcon}>
                                <Ionicons
                                    name={recommendation.icon}
                                    size={32}
                                    color={theme.colors.primary.main}
                                />
                            </View>
                            <Text style={styles.recommendationTitle}>
                                {recommendation.title}
                            </Text>
                            <Text style={styles.recommendationDescription} numberOfLines={2}>
                                {recommendation.description}
                            </Text>
                            <View style={styles.recommendationMeta}>
                                <Text style={styles.recommendationDifficulty}>
                                    {recommendation.difficulty}
                                </Text>
                                <Text style={styles.recommendationDuration}>
                                    {recommendation.duration}분
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* 최근 학습 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>최근 학습</Text>
                {studyData.recentStudies.map((study, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.studyItem}
                        onPress={() => {
                            if (study.type === 'personal') {
                                navigation.navigate('PersonalStudy', { studyId: study.id });
                            } else {
                                navigation.navigate('GroupStudy', { studyId: study.id });
                            }
                        }}
                    >
                        <View style={styles.studyIcon}>
                            <Ionicons
                                name={study.type === 'personal' ? 'person' : 'people'}
                                size={24}
                                color={theme.colors.primary.main}
                            />
                        </View>
                        <View style={styles.studyInfo}>
                            <Text style={styles.studyTitle}>{study.title}</Text>
                            <Text style={styles.studyProgress}>
                                진도율 {study.progress}% • {
                                date.formatDuration(study.studyTime)
                            }
                            </Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={24}
                            color={theme.colors.text.secondary}
                        />
                    </TouchableOpacity>
                ))}
            </View>

            {/* 추천 퀴즈 */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>추천 퀴즈</Text>
                    <TouchableOpacity
                        style={styles.sectionButton}
                        onPress={() => navigation.navigate('Quiz')}
                    >
                        <Text style={styles.sectionButtonText}>더보기</Text>
                    </TouchableOpacity>
                </View>

                {studyData.recommendedQuizzes.map((quiz, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.quizItem}
                        onPress={() => handleStartQuiz(quiz.id)}
                    >
                        <View style={[
                            styles.quizIcon,
                            { backgroundColor: quiz.color + '20' }
                        ]}>
                            <Ionicons
                                name={quiz.icon}
                                size={24}
                                color={quiz.color}
                            />
                        </View>
                        <View style={styles.quizInfo}>
                            <Text style={styles.quizTitle}>{quiz.title}</Text>
                            <Text style={styles.quizMeta}>
                                {quiz.questionCount}문제 • {quiz.estimatedTime}분
                            </Text>
                        </View>
                        <View style={styles.quizDifficulty}>
                            <Text style={[
                                styles.quizDifficultyText,
                                { color: quiz.color }
                            ]}>
                                {quiz.difficulty}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* 학습 자료 */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>학습 자료</Text>
                    <TouchableOpacity
                        style={styles.sectionButton}
                        onPress={() => navigation.navigate('StudyMaterial')}
                    >
                        <Text style={styles.sectionButtonText}>더보기</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.materialsContainer}
                >
                    {studyData.studyMaterials.map((material, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.materialItem}
                            onPress={() => handleViewMaterial(material.id)}
                        >
                            <Image
                                source={{ uri: material.thumbnail }}
                                style={styles.materialThumbnail}
                            />
                            <View style={styles.materialInfo}>
                                <Text style={styles.materialTitle} numberOfLines={2}>
                                    {material.title}
                                </Text>
                                <Text style={styles.materialType}>
                                    {material.type} • {material.duration}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
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
    modeContainer: {
        flexDirection: 'row',
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    modeButton: {
        flex: 1,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    modeIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.primary.main + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    modeTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    modeDescription: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    statsContainer: {
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        margin: theme.spacing.lg,
    },
    statsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    statsTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    statsButton: {
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.sm,
    },
    statsButtonText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.primary.main,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    statsItem: {
        width: (width - theme.spacing.lg * 4) / 2,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.layout.components.borderRadius,
        alignItems: 'center',
    },
    statsValue: {
        fontSize: theme.typography.size.h3,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.primary.main,
        marginBottom: theme.spacing.xs,
    },
    statsLabel: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    chartContainer: {
        marginTop: theme.spacing.md,
    },
    chart: {
        marginVertical: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
    },
    section: {
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
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
    recommendationsContainer: {
        paddingRight: theme.spacing.lg,
    },
    recommendationItem: {
        width: width * 0.7,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        marginRight: theme.spacing.md,
    },
    recommendationIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.primary.main + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    recommendationTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    recommendationDescription: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    recommendationMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    recommendationDifficulty: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.primary.main,
    },
    recommendationDuration: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    studyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        marginBottom: theme.spacing.sm,
    },
    studyIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.primary.main + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    studyInfo: {
        flex: 1,
    },
    studyTitle: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    studyProgress: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    quizItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        marginBottom: theme.spacing.sm,
    },
    quizIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
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
    quizMeta: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    quizDifficulty: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: 12,
    },
    quizDifficultyText: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
    },
    materialsContainer: {
        paddingRight: theme.spacing.lg,
    },
    materialItem: {
        width: width * 0.6,
        marginRight: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        overflow: 'hidden',
    },
    materialThumbnail: {
        width: '100%',
        height: 120,
        backgroundColor: theme.colors.grey[200],
    },
    materialInfo: {
        padding: theme.spacing.md,
    },
    materialTitle: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    materialType: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    }
});
    