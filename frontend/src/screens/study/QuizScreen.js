// src/screens/study/QuizScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Animated,
    Dimensions
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../utils/styles';
import { date } from '../../utils/helpers';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function QuizScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { quizId, studyId } = route.params;

    // 상태 관리
    const [quizData, setQuizData] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [results, setResults] = useState(null);

    // 애니메이션 값
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    // 타이머 ref
    const timerRef = useRef(null);

    // 퀴즈 데이터 로드
    useEffect(() => {
        loadQuizData();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const loadQuizData = async () => {
        try {
            setIsLoading(true);
            const response = await api.quiz.getQuizData(quizId);
            setQuizData(response);
            setTimeLeft(response.timeLimit);
            startTimer();
        } catch (error) {
            Alert.alert('오류', '퀴즈 데이터를 불러오는데 실패했습니다.');
            navigation.goBack();
        } finally {
            setIsLoading(false);
        }
    };

    // 타이머 시작
    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleQuizComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // 다음 문제로 이동
    const goToNextQuestion = () => {
        if (currentQuestionIndex < quizData.questions.length - 1) {
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();

            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
        } else {
            handleQuizComplete();
        }
    };

    // 답변 선택
    const handleSelectAnswer = (answerIndex) => {
        setSelectedAnswer(answerIndex);
        setAnswers(prev => [
            ...prev,
            {
                questionIndex: currentQuestionIndex,
                selectedAnswer: answerIndex
            }
        ]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    // 퀴즈 완료 처리
    const handleQuizComplete = async () => {
        clearInterval(timerRef.current);
        setQuizCompleted(true);

        try {
            const response = await api.quiz.submitQuiz(quizId, answers);
            setResults(response);
        } catch (error) {
            Alert.alert('오류', '퀴즈 결과를 제출하는데 실패했습니다.');
        }
    };

    // 진행 상황 업데이트
    useEffect(() => {
        if (quizData) {
            Animated.timing(progressAnim, {
                toValue: (currentQuestionIndex + 1) / quizData.questions.length,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
    }, [currentQuestionIndex, quizData]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
        );
    }

    if (quizCompleted && results) {
        return (
            <ScrollView style={styles.container}>
                <View style={styles.resultContainer}>
                    <Text style={styles.resultTitle}>퀴즈 결과</Text>
                    <Text style={styles.resultScore}>
                        {results.correctAnswers} / {quizData.questions.length}
                    </Text>
                    <Text style={styles.resultPercentage}>
                        {Math.round((results.correctAnswers / quizData.questions.length) * 100)}%
                    </Text>
                    <Text style={styles.resultTime}>
                        소요 시간: {date.formatDuration(quizData.timeLimit - timeLeft)}
                    </Text>
                </View>

                {results.questions.map((question, index) => (
                    <View key={index} style={styles.resultQuestionContainer}>
                        <Text style={styles.resultQuestionText}>
                            {index + 1}. {question.text}
                        </Text>
                        {question.options.map((option, optionIndex) => (
                            <View
                                key={optionIndex}
                                style={[
                                    styles.resultOptionContainer,
                                    question.correctAnswer === optionIndex && styles.correctOption,
                                    question.userAnswer === optionIndex &&
                                    question.userAnswer !== question.correctAnswer &&
                                    styles.incorrectOption
                                ]}
                            >
                                <Text style={styles.resultOptionText}>
                                    {option}
                                </Text>
                                {question.correctAnswer === optionIndex && (
                                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.status.success} />
                                )}
                                {question.userAnswer === optionIndex &&
                                    question.userAnswer !== question.correctAnswer && (
                                        <Ionicons name="close-circle" size={24} color={theme.colors.status.error} />
                                    )}
                            </View>
                        ))}
                        {question.explanation && (
                            <Text style={styles.explanationText}>
                                설명: {question.explanation}
                            </Text>
                        )}
                    </View>
                ))}

                <TouchableOpacity
                    style={styles.finishButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.finishButtonText}>완료</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    }

    const currentQuestion = quizData.questions[currentQuestionIndex];

    return (
        <View style={styles.container}>
            {/* 진행 상황 바 */}
            <View style={styles.progressContainer}>
                <Animated.View
                    style={[
                        styles.progressBar,
                        {
                            width: progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%'],
                            }),
                        },
                    ]}
                />
            </View>

            {/* 타이머 */}
            <View style={styles.timerContainer}>
                <Ionicons name="time-outline" size={24} color={theme.colors.text.secondary} />
                <Text style={styles.timerText}>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </Text>
            </View>

            <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
                <Text style={styles.questionNumber}>
                    {currentQuestionIndex + 1} / {quizData.questions.length}
                </Text>
                <Text style={styles.questionText}>{currentQuestion.text}</Text>

                {currentQuestion.options.map((option, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.optionButton,
                            selectedAnswer === index && styles.selectedOption
                        ]}
                        onPress={() => handleSelectAnswer(index)}
                    >
                        <Text style={[
                            styles.optionText,
                            selectedAnswer === index && styles.selectedOptionText
                        ]}>
                            {option}
                        </Text>
                    </TouchableOpacity>
                ))}
            </Animated.View>

            <TouchableOpacity
                style={[
                    styles.nextButton,
                    (!selectedAnswer && currentQuestionIndex !== quizData.questions.length - 1) &&
                    styles.nextButtonDisabled
                ]}
                onPress={goToNextQuestion}
                disabled={!selectedAnswer && currentQuestionIndex !== quizData.questions.length - 1}
            >
                <Text style={styles.nextButtonText}>
                    {currentQuestionIndex === quizData.questions.length - 1 ? '완료' : '다음'}
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
    progressContainer: {
        height: 4,
        backgroundColor: theme.colors.grey[200],
    },
    progressBar: {
        height: '100%',
        backgroundColor: theme.colors.primary.main,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.md,
    },
    timerText: {
        marginLeft: theme.spacing.sm,
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    questionContainer: {
        flex: 1,
        padding: theme.spacing.lg,
    },
    questionNumber: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.md,
    },
    questionText: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xl,
    },
    optionButton: {
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        marginBottom: theme.spacing.md,
    },
    selectedOption: {
        backgroundColor: theme.colors.primary.main + '20',
        borderColor: theme.colors.primary.main,
        borderWidth: 2,
    },
    optionText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.primary,
    },
    selectedOptionText: {
        color: theme.colors.primary.main,
        fontFamily: theme.typography.fontFamily.medium,
    },
    nextButton: {
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.primary.main,
        alignItems: 'center',
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        borderRadius: theme.layout.components.borderRadius,
    },
    nextButtonDisabled: {
        backgroundColor: theme.colors.grey[300],
    },
    nextButtonText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    },
    resultContainer: {
        alignItems: 'center',
        padding: theme.spacing.xl,
        backgroundColor: theme.colors.background.secondary,
        marginBottom: theme.spacing.lg,
    },
    resultTitle: {
        fontSize: theme.typography.size.h3,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    resultScore: {
        fontSize: theme.typography.size.h2,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.primary.main,
        marginBottom: theme.spacing.xs,
    },
    resultPercentage: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    resultTime: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    resultQuestionContainer: {
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background.secondary,
        marginBottom: theme.spacing.md,
        marginHorizontal: theme.spacing.md,
        borderRadius: theme.layout.components.borderRadius,
    },
    resultQuestionText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    resultOptionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.layout.components.borderRadius,
        marginBottom: theme.spacing.sm,
    },
    correctOption: {
        backgroundColor: theme.colors.status.success + '20',
    },
    incorrectOption: {
        backgroundColor: theme.colors.status.error + '20',
    },
    resultOptionText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.primary,
        flex: 1,
    },
    explanationText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.md,
        fontStyle: 'italic',
    },
    finishButton: {
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.primary.main,
        alignItems: 'center',
        marginHorizontal: theme.spacing.lg,
        marginVertical: theme.spacing.lg,
        borderRadius: theme.layout.components.borderRadius,
    },
    finishButtonText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    }
});