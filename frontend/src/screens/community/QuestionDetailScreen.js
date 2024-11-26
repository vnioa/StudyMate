import React, { useState, useEffect } from 'react';
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
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const QuestionDetailScreen = ({ route, navigation }) => {
    const { questionId } = route.params;
    const [question, setQuestion] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [newAnswer, setNewAnswer] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchQuestionDetail();
    }, [questionId]);

    const fetchQuestionDetail = async () => {
        try {
            setLoading(true);
            const questionData = await questionApi.getQuestionDetail(questionId);
            setQuestion(questionData);
            setAnswers(questionData.answers);
        } catch (error) {
            Alert.alert('오류', '질문을 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitAnswer = async () => {
        if (!newAnswer.trim()) return;

        try {
            setSubmitting(true);
            const response = await questionApi.createAnswer(questionId, newAnswer);
            setAnswers(prev => [...prev, response.data]);
            setNewAnswer('');
        } catch (error) {
            Alert.alert('오류', '답변 등록에 실패했습니다');
        } finally {
            setSubmitting(false);
        }
    };

    const handleOptionsPress = () => {
        Alert.alert('질문 관리', '', [
            { text: '수정하기', onPress: () => navigation.navigate('EditQuestion', { questionId }) },
            { text: '삭제하기', onPress: handleDeleteQuestion, style: 'destructive' },
            { text: '취소', style: 'cancel' },
        ]);
    };

    const handleDeleteQuestion = async () => {
        try {
            await questionApi.deleteQuestion(questionId);
            navigation.goBack();
        } catch (error) {
            Alert.alert('오류', '질문 삭제에 실패했습니다');
        }
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />;
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>질문 상세</Text>
                <TouchableOpacity onPress={handleOptionsPress}>
                    <Ionicons name="ellipsis-horizontal" size={24} color="black" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
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
                        <View key={answer.id} style={styles.answerItem}>
                            <View style={styles.answerHeader}>
                                <Text style={styles.answerAuthor}>{answer.author}</Text>
                                <Text style={styles.answerTime}>{answer.createdAt}</Text>
                            </View>
                            <Text style={styles.answerContent}>{answer.content}</Text>
                        </View>
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
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons
                            name="send"
                            size={24}
                            color={newAnswer.trim() ? "#4A90E2" : "#ccc"}
                        />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    questionContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    authorInfo: {
        color: '#666',
    },
    editedBadge: {
        marginLeft: 8,
        fontSize: 12,
        color: '#666',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    questionContent: {
        fontSize: 16,
        lineHeight: 24,
    },
    answersSection: {
        padding: 16,
    },
    answersTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    answerItem: {
        marginBottom: 20,
        backgroundColor: '#f8f8f8',
        padding: 12,
        borderRadius: 8,
    },
    answerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    answerAuthor: {
        fontSize: 16,
        fontWeight: '500',
    },
    answerTime: {
        color: '#666',
        fontSize: 14,
    },
    answerContent: {
        fontSize: 15,
        lineHeight: 22,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        maxHeight: 100,
    },
    sendButton: {
        padding: 8,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default QuestionDetailScreen;