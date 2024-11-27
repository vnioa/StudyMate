import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { communityAPI } from '../../services/api';
import { theme } from '../../styles/theme';

const QuestionDetailScreen = memo(({ route, navigation }) => {
    const { questionId } = route.params;
    const [question, setQuestion] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [newAnswer, setNewAnswer] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const fetchQuestionDetail = useCallback(async () => {
        try {
            setLoading(true);
            const response = await communityAPI.getQuestionDetail(questionId);
            if (response.data.success) {
                setQuestion(response.data.question);
                setAnswers(response.data.answers);
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '질문을 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [questionId]);

    useFocusEffect(
        useCallback(() => {
            fetchQuestionDetail();
            return () => {
                setQuestion(null);
                setAnswers([]);
            };
        }, [fetchQuestionDetail])
    );

    const handleSubmitAnswer = useCallback(async () => {
        if (!newAnswer.trim()) return;

        try {
            setSubmitting(true);
            const response = await communityAPI.createAnswer(questionId, {
                content: newAnswer.trim()
            });

            if (response.data.success) {
                setAnswers(prev => [...prev, response.data.answer]);
                setNewAnswer('');
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '답변 등록에 실패했습니다'
            );
        } finally {
            setSubmitting(false);
        }
    }, [questionId, newAnswer]);

    const handleOptionsPress = useCallback(() => {
        Alert.alert(
            '질문 관리',
            '',
            [
                {
                    text: '수정하기',
                    onPress: () => navigation.navigate('EditQuestion', { questionId })
                },
                {
                    text: '삭제하기',
                    onPress: handleDeleteQuestion,
                    style: 'destructive'
                },
                {
                    text: '취소',
                    style: 'cancel'
                }
            ]
        );
    }, [questionId, navigation]);

    const handleDeleteQuestion = useCallback(async () => {
        try {
            const response = await communityAPI.deleteQuestion(questionId);
            if (response.data.success) {
                navigation.goBack();
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '질문 삭제에 실패했습니다'
            );
        }
    }, [questionId, navigation]);

    const AnswerItem = memo(({ answer }) => (
        <View style={styles.answerItem}>
            <View style={styles.answerHeader}>
                <Text style={styles.answerAuthor}>{answer.author}</Text>
                <Text style={styles.answerTime}>{answer.createdAt}</Text>
            </View>
            <Text style={styles.answerContent}>{answer.content}</Text>
        </View>
    ));

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>질문 상세</Text>
                <TouchableOpacity
                    onPress={handleOptionsPress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name="ellipsis-horizontal"
                        size={24}
                        color={theme.colors.text}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {question && (
                    <View style={styles.questionContainer}>
                        <Text style={styles.title}>{question.title}</Text>
                        <View style={styles.authorContainer}>
                            <Text style={styles.authorInfo}>
                                {question.author} • {question.createdAt}
                            </Text>
                            {question.isEdited && (
                                <Text style={styles.editedBadge}>수정됨</Text>
                            )}
                        </View>
                        <Text style={styles.questionContent}>{question.content}</Text>
                    </View>
                )}

                <View style={styles.answersSection}>
                    <Text style={styles.answersTitle}>
                        답변 {answers.length}개
                    </Text>
                    {answers.map((answer) => (
                        <AnswerItem key={answer.id} answer={answer} />
                    ))}
                </View>
            </ScrollView>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="답변을 입력하세요"
                    value={newAnswer}
                    onChangeText={setNewAnswer}
                    multiline
                    maxLength={1000}
                    editable={!submitting}
                />
                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        (!newAnswer.trim() || submitting) && styles.sendButtonDisabled
                    ]}
                    onPress={handleSubmitAnswer}
                    disabled={!newAnswer.trim() || submitting}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color={theme.colors.white} />
                    ) : (
                        <Ionicons
                            name="send"
                            size={24}
                            color={newAnswer.trim() ? theme.colors.primary : theme.colors.disabled}
                        />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    content: {
        flex: 1,
    },
    questionContainer: {
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    title: {
        ...theme.typography.headlineMedium,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    authorInfo: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    editedBadge: {
        marginLeft: theme.spacing.sm,
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
        backgroundColor: theme.colors.surface,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.roundness.small,
    },
    questionContent: {
        ...theme.typography.bodyLarge,
        lineHeight: 24,
        color: theme.colors.text,
    },
    answersSection: {
        padding: theme.spacing.md,
    },
    answersTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    answerItem: {
        marginBottom: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.medium,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    answerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    answerAuthor: {
        ...theme.typography.bodyLarge,
        fontWeight: '500',
        color: theme.colors.text,
    },
    answerTime: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    answerContent: {
        ...theme.typography.bodyMedium,
        lineHeight: 22,
        color: theme.colors.text,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    input: {
        flex: 1,
        ...theme.typography.bodyLarge,
        backgroundColor: theme.colors.background,
        borderRadius: theme.roundness.large,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        marginRight: theme.spacing.sm,
        maxHeight: 100,
        color: theme.colors.text,
    },
    sendButton: {
        padding: theme.spacing.sm,
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
});

QuestionDetailScreen.displayName = 'QuestionDetailScreen';

export default QuestionDetailScreen;