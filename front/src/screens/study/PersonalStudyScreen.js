// src/screens/study/PersonalStudyScreen.js

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
    Alert,
    ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../utils/styles';
import { date } from '../../utils/helpers';
import { CircularProgress } from '../../components/UI';
import api from '../../services/api';

export default function PersonalStudyScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { studyId } = route.params || {};

    // 상태 관리
    const [studyData, setStudyData] = useState({
        title: '',
        subject: '',
        progress: 0,
        totalTime: 0,
        todayTime: 0,
        currentChapter: null,
        chapters: [],
        materials: [],
        quizzes: [],
        notes: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isStudying, setIsStudying] = useState(false);
    const [timer, setTimer] = useState(0);
    const [timerInterval, setTimerInterval] = useState(null);

    // 데이터 로드
    useEffect(() => {
        loadStudyData();
        return () => {
            if (timerInterval) {
                clearInterval(timerInterval);
            }
        };
    }, []);

    const loadStudyData = async () => {
        try {
            setIsLoading(true);
            const response = await api.study.getPersonalStudy(studyId);
            setStudyData(response);
        } catch (error) {
            console.error('Failed to load study data:', error);
            Alert.alert('오류', '학습 데이터를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // 학습 시작/종료
    const handleToggleStudy = async () => {
        try {
            if (isStudying) {
                // 학습 종료
                clearInterval(timerInterval);
                setTimerInterval(null);
                await api.study.endSession({
                    studyId,
                    duration: timer,
                    progress: studyData.progress
                });
                setIsStudying(false);
                loadStudyData();
            } else {
                // 학습 시작
                const interval = setInterval(() => {
                    setTimer(prev => prev + 1);
                }, 1000);
                setTimerInterval(interval);
                await api.study.startSession(studyId);
                setIsStudying(true);
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
            Alert.alert('오류', '학습 세션 관리에 실패했습니다.');
        }
    };

    // 챕터 완료 처리
    const handleCompleteChapter = async (chapterId) => {
        try {
            await api.study.completeChapter(studyId, chapterId);
            loadStudyData();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Alert.alert('오류', '챕터 완료 처리에 실패했습니다.');
        }
    };

    // 퀴즈 시작
    const handleStartQuiz = (quizId) => {
        navigation.navigate('Quiz', {
            studyId,
            quizId
        });
    };

    // 학습 자료 보기
    const handleViewMaterial = (materialId) => {
        navigation.navigate('StudyMaterial', {
            studyId,
            materialId
        });
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
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
                {/* 학습 개요 */}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryHeader}>
                        <View>
                            <Text style={styles.title}>{studyData.title}</Text>
                            <Text style={styles.subject}>{studyData.subject}</Text>
                        </View>
                        <CircularProgress
                            value={studyData.progress}
                            size={60}
                            thickness={6}
                            color={theme.colors.primary.main}
                            unfilledColor={theme.colors.grey[200]}
                            textStyle={styles.progressText}
                        />
                    </View>

                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {date.formatDuration(studyData.totalTime)}
                            </Text>
                            <Text style={styles.statLabel}>총 학습시간</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {date.formatDuration(studyData.todayTime)}
                            </Text>
                            <Text style={styles.statLabel}>오늘 학습시간</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {studyData.chapters.filter(ch => ch.isCompleted).length}/
                                {studyData.chapters.length}
                            </Text>
                            <Text style={styles.statLabel}>완료한 챕터</Text>
                        </View>
                    </View>
                </View>

                {/* 현재 학습 중인 챕터 */}
                {studyData.currentChapter && (
                    <View style={styles.currentChapter}>
                        <Text style={styles.sectionTitle}>현재 학습</Text>
                        <View style={styles.chapterCard}>
                            <View style={styles.chapterInfo}>
                                <Text style={styles.chapterTitle}>
                                    {studyData.currentChapter.title}
                                </Text>
                                <Text style={styles.chapterDescription}>
                                    {studyData.currentChapter.description}
                                </Text>
                                <View style={styles.chapterProgress}>
                                    <View style={[
                                        styles.progressBar,
                                        { width: `${studyData.currentChapter.progress}%` }
                                    ]} />
                                </View>
                            </View>
                            {isStudying && (
                                <Text style={styles.timerText}>
                                    {date.formatDuration(timer)}
                                </Text>
                            )}
                        </View>
                    </View>
                )}

                {/* 학습 자료 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>학습 자료</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.materialsContainer}
                    >
                        {studyData.materials.map((material, index) => (
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

                {/* 퀴즈 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>퀴즈</Text>
                    {studyData.quizzes.map((quiz, index) => (
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
                                    name={quiz.isCompleted ? 'checkmark-circle' : 'help-circle'}
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
                            {quiz.isCompleted && (
                                <View style={styles.quizScore}>
                                    <Text style={styles.quizScoreText}>{quiz.score}점</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 학습 노트 */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>학습 노트</Text>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => {
                                // 학습 노트 추가 기능
                            }}
                        >
                            <Ionicons name="add" size={24} color={theme.colors.primary.main} />
                        </TouchableOpacity>
                    </View>
                    {studyData.notes.map((note, index) => (
                        <View key={index} style={styles.noteItem}>
                            <Text style={styles.noteText}>{note.content}</Text>
                            <Text style={styles.noteDate}>
                                {date.formatRelative(note.createdAt)}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* 학습 시작/종료 버튼 */}
            <TouchableOpacity
                style={[
                    styles.studyButton,
                    isStudying && styles.studyButtonActive
                ]}
                onPress={handleToggleStudy}
            >
                <Text style={[
                    styles.studyButtonText,
                    isStudying && styles.studyButtonTextActive
                ]}>
                    {isStudying ? '학습 종료' : '학습 시작'}
                </Text>
            </TouchableOpacity>
        </View>
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
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontSize: theme.typography.size.h3,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    subject: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    progressText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.primary.main,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    currentChapter: {
        padding: theme.spacing.lg,
    },
    chapterCard: {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        padding: theme.spacing.lg,
    },
    chapterInfo: {
        marginBottom: theme.spacing.md,
    },
    chapterTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    chapterDescription: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    chapterProgress: {
        height: 4,
        backgroundColor: theme.colors.grey[200],
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: theme.colors.primary.main,
    },
    timerText: {
        fontSize: theme.typography.size.h3,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.primary.main,
        textAlign: 'center',
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
        marginBottom: theme.spacing.md,
    },
    materialsContainer: {
        paddingRight: theme.spacing.lg,
    },
    materialItem: {
        width: 200,
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
        marginBottom: 2,
    },
    materialType: {
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
    quizScore: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        backgroundColor: theme.colors.primary.main + '20',
        borderRadius: 12,
    },
    quizScoreText: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.primary.main,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary.main + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noteItem: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        marginBottom: theme.spacing.sm,
    },
    noteText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    noteDate: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    studyButton: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 34 : 24,
        left: theme.spacing.lg,
        right: theme.spacing.lg,
        height: 56,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    studyButtonActive: {
        backgroundColor: theme.colors.primary.main,
    },
    studyButtonText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    studyButtonTextActive: {
        color: theme.colors.text.contrast,
    }
});