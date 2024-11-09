// src/screens/study/AIRecommendScreen.js

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
    ActivityIndicator,
    Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../utils/styles';
import { date } from '../../utils/helpers';
import api from '../../services/api';

export default function AIRecommendScreen() {
    const navigation = useNavigation();

    // 상태 관리
    const [recommendations, setRecommendations] = useState({
        personalizedContent: [],
        dailyGoals: {
            target: 0,
            current: 0,
            recommendations: []
        },
        weakPoints: [],
        learningPath: {
            currentLevel: '',
            nextMilestone: '',
            requiredSkills: []
        },
        studySchedule: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');

    // 데이터 로드
    useEffect(() => {
        loadRecommendations();
    }, []);

    const loadRecommendations = async () => {
        try {
            setIsLoading(true);
            const response = await api.study.getAIRecommendations();
            setRecommendations(response);
        } catch (error) {
            Alert.alert('오류', 'AI 추천을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // 학습 시작
    const handleStartLearning = async (contentId) => {
        try {
            const response = await api.study.startRecommendedLearning(contentId);

            if (response.type === 'quiz') {
                navigation.navigate('Quiz', { quizId: response.id });
            } else if (response.type === 'material') {
                navigation.navigate('StudyMaterial', { materialId: response.id });
            } else {
                navigation.navigate('PersonalStudy', { studyId: response.id });
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Alert.alert('오류', '학습을 시작하는데 실패했습니다.');
        }
    };

    // 목표 설정
    const handleUpdateGoal = async (goalId) => {
        try {
            await api.study.updateLearningGoal(goalId);
            loadRecommendations();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            Alert.alert('오류', '목표 설정에 실패했습니다.');
        }
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
                        loadRecommendations();
                    }}
                    colors={[theme.colors.primary.main]}
                />
            }
        >
            {/* 일일 목표 진행 상황 */}
            <View style={styles.goalContainer}>
                <View style={styles.goalHeader}>
                    <Text style={styles.goalTitle}>오늘의 학습 목표</Text>
                    <Text style={styles.goalProgress}>
                        {Math.round((recommendations.dailyGoals.current / recommendations.dailyGoals.target) * 100)}%
                    </Text>
                </View>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            {
                                width: `${(recommendations.dailyGoals.current / recommendations.dailyGoals.target) * 100}%`
                            }
                        ]}
                    />
                </View>
                <Text style={styles.goalText}>
                    목표 {date.formatDuration(recommendations.dailyGoals.target)} 중{' '}
                    {date.formatDuration(recommendations.dailyGoals.current)} 완료
                </Text>
            </View>

            {/* 카테고리 선택 */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryContainer}
                contentContainerStyle={styles.categoryContent}
            >
                {['all', 'quiz', 'material', 'exercise'].map((category) => (
                    <TouchableOpacity
                        key={category}
                        style={[
                            styles.categoryButton,
                            selectedCategory === category && styles.categoryButtonActive
                        ]}
                        onPress={() => {
                            setSelectedCategory(category);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                    >
                        <Text style={[
                            styles.categoryButtonText,
                            selectedCategory === category && styles.categoryButtonTextActive
                        ]}>
                            {getCategoryName(category)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* 개인화된 추천 콘텐츠 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>맞춤 추천</Text>
                {recommendations.personalizedContent
                    .filter(content => selectedCategory === 'all' || content.type === selectedCategory)
                    .map((content, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.contentItem}
                            onPress={() => handleStartLearning(content.id)}
                        >
                            <View style={[
                                styles.contentIcon,
                                { backgroundColor: content.color + '20' }
                            ]}>
                                <Ionicons
                                    name={getContentIcon(content.type)}
                                    size={24}
                                    color={content.color}
                                />
                            </View>
                            <View style={styles.contentInfo}>
                                <Text style={styles.contentTitle}>{content.title}</Text>
                                <Text style={styles.contentDescription} numberOfLines={2}>
                                    {content.description}
                                </Text>
                                <View style={styles.contentMeta}>
                                    <Text style={styles.contentDuration}>
                                        {content.estimatedTime}분
                                    </Text>
                                    <Text style={styles.contentDifficulty}>
                                        {content.difficulty}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
            </View>

            {/* 취약점 보완 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>취약점 보완</Text>
                {recommendations.weakPoints.map((point, index) => (
                    <View key={index} style={styles.weakPointItem}>
                        <View style={styles.weakPointHeader}>
                            <Text style={styles.weakPointTitle}>{point.subject}</Text>
                            <Text style={styles.weakPointScore}>
                                정답률 {point.accuracy}%
                            </Text>
                        </View>
                        <Text style={styles.weakPointDescription}>
                            {point.recommendation}
                        </Text>
                        <View style={styles.weakPointActions}>
                            {point.suggestedContent.map((content, contentIndex) => (
                                <TouchableOpacity
                                    key={contentIndex}
                                    style={styles.weakPointButton}
                                    onPress={() => handleStartLearning(content.id)}
                                >
                                    <Text style={styles.weakPointButtonText}>
                                        {content.title}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
            </View>

            {/* 학습 경로 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>학습 경로</Text>
                <View style={styles.pathContainer}>
                    <Text style={styles.currentLevel}>
                        현재 레벨: {recommendations.learningPath.currentLevel}
                    </Text>
                    <Text style={styles.nextMilestone}>
                        다음 목표: {recommendations.learningPath.nextMilestone}
                    </Text>
                    <View style={styles.requiredSkills}>
                        <Text style={styles.skillsTitle}>필요한 스킬:</Text>
                        {recommendations.learningPath.requiredSkills.map((skill, index) => (
                            <View key={index} style={styles.skillItem}>
                                <Ionicons
                                    name={skill.achieved ? "checkmark-circle" : "ellipse-outline"}
                                    size={20}
                                    color={skill.achieved ? theme.colors.status.success : theme.colors.text.secondary}
                                />
                                <Text style={[
                                    styles.skillText,
                                    skill.achieved && styles.skillTextAchieved
                                ]}>
                                    {skill.name}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* 추천 학습 일정 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>추천 학습 일정</Text>
                {recommendations.studySchedule.map((schedule, index) => (
                    <View key={index} style={styles.scheduleItem}>
                        <View style={styles.scheduleTime}>
                            <Text style={styles.scheduleTimeText}>
                                {schedule.time}
                            </Text>
                            <Text style={styles.scheduleDuration}>
                                {schedule.duration}분
                            </Text>
                        </View>
                        <View style={styles.scheduleContent}>
                            <Text style={styles.scheduleTitle}>
                                {schedule.title}
                            </Text>
                            <Text style={styles.scheduleDescription}>
                                {schedule.description}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.scheduleButton}
                            onPress={() => handleStartLearning(schedule.contentId)}
                        >
                            <Ionicons
                                name="arrow-forward"
                                size={24}
                                color={theme.colors.primary.main}
                            />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

// 유틸리티 함수
const getCategoryName = (category) => {
    switch (category) {
        case 'all':
            return '전체';
        case 'quiz':
            return '퀴즈';
        case 'material':
            return '학습자료';
        case 'exercise':
            return '연습문제';
        default:
            return '';
    }
};

const getContentIcon = (type) => {
    switch (type) {
        case 'quiz':
            return 'help-circle-outline';
        case 'material':
            return 'document-text-outline';
        case 'exercise':
            return 'pencil-outline';
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
    goalContainer: {
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background.secondary,
        marginBottom: theme.spacing.md,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    goalTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    goalProgress: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.primary.main,
    },
    progressBar: {
        height: 8,
        backgroundColor: theme.colors.grey[200],
        borderRadius: 4,
        marginBottom: theme.spacing.sm,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.primary.main,
        borderRadius: 4,
    },
    goalText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    categoryContainer: {
        marginBottom: theme.spacing.md,
    },
    categoryContent: {
        padding: theme.spacing.md,
    },
    categoryButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.layout.components.borderRadius,
        backgroundColor: theme.colors.background.secondary,
        marginRight: theme.spacing.sm,
    },
    categoryButtonActive: {
        backgroundColor: theme.colors.primary.main,
    },
    categoryButtonText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.secondary,
    },
    categoryButtonTextActive: {
        color: theme.colors.text.contrast,
    },
    section: {
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    contentItem: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        marginBottom: theme.spacing.sm,
    },
    contentIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    contentInfo: {
        flex: 1,
    },
    contentTitle: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    contentDescription: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    contentMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    contentDuration: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    contentDifficulty: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.primary.main,
    },
    weakPointItem: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        marginBottom: theme.spacing.md,
    },
    weakPointHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    weakPointTitle: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    weakPointScore: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.status.error,
    },
    weakPointDescription: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.md,
    },
    weakPointActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    weakPointButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.primary.main + '20',
        borderRadius: theme.layout.components.borderRadius,
    },
    weakPointButtonText: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.primary.main,
    },
    pathContainer: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
    },
    currentLevel: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    nextMilestone: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.md,
    },
    requiredSkills: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: theme.spacing.md,
    },
    skillsTitle: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    skillItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    skillText: {
        marginLeft: theme.spacing.sm,
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    skillTextAchieved: {
        color: theme.colors.status.success,
        fontFamily: theme.typography.fontFamily.medium,
    },
    scheduleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        marginBottom: theme.spacing.sm,
    },
    scheduleTime: {
        width: 80,
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    scheduleTimeText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    scheduleDuration: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    scheduleContent: {
        flex: 1,
        marginRight: theme.spacing.md,
    },
    scheduleTitle: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    scheduleDescription: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    scheduleButton: {
        padding: theme.spacing.sm,
    }
});