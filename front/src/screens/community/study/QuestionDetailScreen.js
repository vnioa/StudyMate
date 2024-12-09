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
import { theme } from '../../../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from '../../../api/api';

const AnswerItem = memo(({ answer, onDelete, onUpdate, isOnline }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(answer.content);
    const [submitting, setSubmitting] = useState(false);

    const handleOptionsPress = useCallback(() => {
        if (!isOnline) return;

        Alert.alert(
            '답변 관리',
            '',
            [
                { text: '수정하기', onPress: () => setIsEditing(true) },
                { text: '삭제하기', onPress: handleDelete, style: 'destructive' },
                { text: '취소', style: 'cancel' }
            ]
        );
    }, [isOnline]);

    const handleDelete = useCallback(async () => {
        if (!isOnline) return;

        Alert.alert(
            '답변 삭제',
            '정말 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => onDelete(answer.id)
                }
            ]
        );
    }, [answer.id, onDelete, isOnline]);

    const handleUpdate = useCallback(async () => {
        if (!isOnline) return;

        if (!editedContent.trim() || editedContent === answer.content) {
            setIsEditing(false);
            setEditedContent(answer.content);
            return;
        }

        try {
            setSubmitting(true);
            await onUpdate(answer.id, editedContent.trim());
            setIsEditing(false);
        } catch (error) {
            Alert.alert('오류', '답변 수정에 실패했습니다');
        } finally {
            setSubmitting(false);
        }
    }, [answer.id, editedContent, onUpdate, isOnline]);

    return (
        <View style={[
            styles.answerItem,
            !isOnline && styles.itemDisabled
        ]}>
            <View style={styles.answerHeader}>
                <Text style={styles.answerAuthor}>{answer.author}</Text>
                <View style={styles.answerHeaderRight}>
                    <Text style={styles.answerTime}>{answer.createdAt}</Text>
                    {answer.isAuthor && (
                        <TouchableOpacity
                            onPress={handleOptionsPress}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            disabled={!isOnline}
                        >
                            <Ionicons
                                name="ellipsis-horizontal"
                                size={20}
                                color={isOnline ? theme.colors.textSecondary : theme.colors.textDisabled}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {isEditing ? (
                <View style={styles.editContainer}>
                    <TextInput
                        style={[
                            styles.editInput,
                            !isOnline && styles.inputDisabled
                        ]}
                        value={editedContent}
                        onChangeText={setEditedContent}
                        multiline
                        maxLength={1000}
                        editable={!submitting && isOnline}
                    />
                    <View style={styles.editButtons}>
                        <TouchableOpacity
                            style={[styles.editButton, styles.cancelButton]}
                            onPress={() => {
                                setIsEditing(false);
                                setEditedContent(answer.content);
                            }}
                            disabled={submitting || !isOnline}
                        >
                            <Text style={styles.editButtonText}>취소</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.editButton,
                                styles.saveButton,
                                (!editedContent.trim() || submitting || !isOnline) &&
                                styles.disabledButton
                            ]}
                            onPress={handleUpdate}
                            disabled={!editedContent.trim() || submitting || !isOnline}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color={theme.colors.white} />
                            ) : (
                                <Text style={styles.editButtonText}>저장</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <Text style={[
                    styles.answerContent,
                    !isOnline && styles.textDisabled
                ]}>{answer.content}</Text>
            )}
        </View>
    );
});

const QuestionDetailScreen = memo(({ route, navigation }) => {
    const { questionId } = route.params;
    const [question, setQuestion] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [newAnswer, setNewAnswer] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    api.interceptors.request.use(
        async (config) => {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    const checkNetwork = async () => {
        const state = await NetInfo.fetch();
        if (!state.isConnected) {
            setIsOnline(false);
            Alert.alert('네트워크 오류', '인터넷 연결을 확인해주세요.');
            return false;
        }
        setIsOnline(true);
        return true;
    };

    const fetchQuestionDetail = useCallback(async () => {
        if (!(await checkNetwork())) {
            const cachedData = await AsyncStorage.getItem(`question_${questionId}`);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                setQuestion(parsed.question);
                setAnswers(parsed.answers);
            }
            return;
        }

        try {
            setLoading(true);
            const response = await api.get(`/api/community/questions/${questionId}`);
            if (response.data.success) {
                setQuestion(response.data.question);
                setAnswers(response.data.answers);
                await AsyncStorage.setItem(`question_${questionId}`,
                    JSON.stringify(response.data));
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
            const unsubscribe = NetInfo.addEventListener(state => {
                setIsOnline(state.isConnected);
            });
            return () => {
                unsubscribe();
                setQuestion(null);
                setAnswers([]);
            };
        }, [fetchQuestionDetail])
    );

    const handleSubmitAnswer = useCallback(async () => {
        if (!newAnswer.trim() || !(await checkNetwork())) return;

        try {
            setSubmitting(true);
            const response = await api.post(`/api/community/questions/${questionId}/answers`, {
                content: newAnswer.trim()
            });
            if (response.data.success) {
                setAnswers(prev => [...prev, response.data.answer]);
                setNewAnswer('');
                await AsyncStorage.setItem(`question_${questionId}`, JSON.stringify({
                    question,
                    answers: [...answers, response.data.answer]
                }));
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '답변 등록에 실패했습니다'
            );
        } finally {
            setSubmitting(false);
        }
    }, [questionId, newAnswer, question, answers]);

    const handleOptionsPress = useCallback(() => {
        if (!isOnline) return;

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
                { text: '취소', style: 'cancel' }
            ]
        );
    }, [questionId, navigation, isOnline]);

    const handleDeleteQuestion = useCallback(async () => {
        if (!(await checkNetwork())) return;

        try {
            const response = await api.delete(`/api/community/questions/${questionId}`);
            if (response.data.success) {
                await AsyncStorage.removeItem(`question_${questionId}`);
                navigation.goBack();
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '질문 삭제에 실패했습니다'
            );
        }
    }, [questionId, navigation]);

    const handleDeleteAnswer = useCallback(async (answerId) => {
        if (!(await checkNetwork())) return;

        try {
            const response = await api.delete(`/api/community/answers/${answerId}`);
            if (response.data.success) {
                setAnswers(prev => prev.filter(a => a.id !== answerId));
                await AsyncStorage.setItem(`question_${questionId}`, JSON.stringify({
                    question,
                    answers: answers.filter(a => a.id !== answerId)
                }));
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '답변 삭제에 실패했습니다'
            );
        }
    }, [questionId, question, answers]);

    const handleUpdateAnswer = useCallback(async (answerId, content) => {
        if (!(await checkNetwork())) return;

        try {
            const response = await api.put(`/api/community/answers/${answerId}`, {
                content
            });
            if (response.data.success) {
                setAnswers(prev => prev.map(a =>
                    a.id === answerId ? response.data.answer : a
                ));
                await AsyncStorage.setItem(`question_${questionId}`, JSON.stringify({
                    question,
                    answers: answers.map(a =>
                        a.id === answerId ? response.data.answer : a
                    )
                }));
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '답변 수정에 실패했습니다'
            );
        }
    }, [questionId, question, answers]);

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
                    disabled={!isOnline}
                >
                    <Ionicons
                        name="ellipsis-horizontal"
                        size={24}
                        color={isOnline ? theme.colors.text : theme.colors.textDisabled}
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
                        <AnswerItem
                            key={answer.id}
                            answer={answer}
                            onDelete={handleDeleteAnswer}
                            onUpdate={handleUpdateAnswer}
                            isOnline={isOnline}
                        />
                    ))}
                </View>
            </ScrollView>

            <View style={styles.inputContainer}>
                <TextInput
                    style={[
                        styles.input,
                        !isOnline && styles.inputDisabled
                    ]}
                    placeholder="답변을 입력하세요"
                    value={newAnswer}
                    onChangeText={setNewAnswer}
                    multiline
                    maxLength={1000}
                    editable={!submitting && isOnline}
                />
                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        (!newAnswer.trim() || submitting || !isOnline) &&
                        styles.sendButtonDisabled
                    ]}
                    onPress={handleSubmitAnswer}
                    disabled={!newAnswer.trim() || submitting || !isOnline}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color={theme.colors.white} />
                    ) : (
                        <Ionicons
                            name="send"
                            size={24}
                            color={
                                newAnswer.trim() && isOnline
                                    ? theme.colors.primary
                                    : theme.colors.textDisabled
                            }
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
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
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
    textDisabled: {
        color: theme.colors.textDisabled,
    }
});

QuestionDetailScreen.displayName = 'QuestionDetailScreen';

export default memo(QuestionDetailScreen);