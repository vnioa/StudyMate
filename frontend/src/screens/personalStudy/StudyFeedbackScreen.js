import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    Modal,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { feedbackAPI } from '../../services/api';

const StudyFeedbackScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('self');
    const [isSelfEvalModalVisible, setSelfEvalModalVisible] = useState(false);
    const [isJournalModalVisible, setJournalModalVisible] = useState(false);
    const [feedbackHistory, setFeedbackHistory] = useState({
        selfEval: [],
        journal: []
    });

    const [selfEvaluation, setSelfEvaluation] = useState({
        understanding: 3,
        effort: 3,
        efficiency: 3,
        notes: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [studyJournal, setStudyJournal] = useState({
        date: new Date().toISOString().split('T')[0],
        content: '',
        achievements: '',
        difficulties: '',
        improvements: '',
        nextGoals: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchFeedbackData(),
                fetchFeedbackHistory()
            ]);
        } catch (error) {
            Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const fetchFeedbackData = async () => {
        const response = await feedbackAPI.getFeedback();
        if (response.data) {
            setSelfEvaluation(prev => ({
                ...prev,
                ...response.data.selfEvaluation
            }));
            setStudyJournal(prev => ({
                ...prev,
                ...response.data.studyJournal
            }));
        }
    };

    const fetchFeedbackHistory = async () => {
        const [selfEvalResponse, journalResponse] = await Promise.all([
            feedbackAPI.getSelfEvaluationHistory(),
            feedbackAPI.getJournalHistory()
        ]);
        setFeedbackHistory({
            selfEval: selfEvalResponse.data,
            journal: journalResponse.data
        });
    };

    const handleSaveSelfEvaluation = async () => {
        if (!selfEvaluation.notes.trim()) {
            Alert.alert('알림', '평가 내용을 입력해주세요.');
            return;
        }

        try {
            setLoading(true);
            const response = await feedbackAPI.saveSelfEvaluation(selfEvaluation);
            if (response.data.success) {
                setSelfEvalModalVisible(false);
                Alert.alert('성공', '자기 평가가 저장되었습니다.');
                await fetchFeedbackHistory();
            }
        } catch (error) {
            Alert.alert('오류', '자기 평가 저장에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveJournal = async () => {
        if (!studyJournal.content.trim()) {
            Alert.alert('알림', '학습 내용을 입력해주세요.');
            return;
        }

        try {
            setLoading(true);
            const response = await feedbackAPI.saveJournal(studyJournal);
            if (response.data.success) {
                setJournalModalVisible(false);
                Alert.alert('성공', '학습 일지가 저장되었습니다.');
                await fetchFeedbackHistory();
            }
        } catch (error) {
            Alert.alert('오류', '학습 일지 저장에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchInitialData();
        setRefreshing(false);
    };

    const RatingStars = ({ rating, setRating, label }) => (
        <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>{label}</Text>
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                        key={star}
                        onPress={() => setRating(star)}
                        disabled={loading}
                        style={styles.starButton}
                    >
                        <Icon
                            name={star <= rating ? 'star' : 'star'}
                            size={24}
                            color={star <= rating ? '#FFD700' : '#ddd'}
                        />
                    </Pressable>
                ))}
            </View>
        </View>
    );

    const renderFeedbackHistory = () => (
        <View style={styles.historySection}>
            <Text style={styles.historyTitle}>
                {activeTab === 'self' ? '최근 자기 평가' : '최근 학습 일지'}
            </Text>
            {(activeTab === 'self' ? feedbackHistory.selfEval : feedbackHistory.journal)
                .slice(0, 3)
                .map((item, index) => (
                    <View key={index} style={styles.historyItem}>
                        <Text style={styles.historyDate}>{item.date}</Text>
                        <Text style={styles.historyContent}>
                            {activeTab === 'self' ? item.notes : item.content}
                        </Text>
                    </View>
                ))}
        </View>
    );

    if (loading && !selfEvaluation.notes) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </Pressable>
                <Text style={styles.headerTitle}>학습 피드백</Text>
                <View style={styles.headerRight} />
            </View>

            <View style={styles.tabContainer}>
                <Pressable
                    style={[styles.tab, activeTab === 'self' && styles.activeTab]}
                    onPress={() => setActiveTab('self')}
                >
                    <Text style={[styles.tabText, activeTab === 'self' && styles.activeTabText]}>
                        자기 평가
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'journal' && styles.activeTab]}
                    onPress={() => setActiveTab('journal')}
                >
                    <Text style={[styles.tabText, activeTab === 'journal' && styles.activeTabText]}>
                        학습 일지
                    </Text>
                </Pressable>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#4A90E2']}
                    />
                }
            >
                {activeTab === 'self' ? (
                    <Pressable
                        style={styles.feedbackCard}
                        onPress={() => setSelfEvalModalVisible(true)}
                        disabled={loading}
                    >
                        <View style={styles.cardHeader}>
                            <Icon name="user" size={24} color="#4A90E2" />
                            <Text style={styles.cardTitle}>자기 평가</Text>
                        </View>
                        <Text style={styles.cardDescription}>
                            오늘의 학습을 스스로 평가해보세요
                        </Text>
                    </Pressable>
                ) : (
                    <Pressable
                        style={styles.feedbackCard}
                        onPress={() => setJournalModalVisible(true)}
                        disabled={loading}
                    >
                        <View style={styles.cardHeader}>
                            <Icon name="book" size={24} color="#4A90E2" />
                            <Text style={styles.cardTitle}>학습 일지</Text>
                        </View>
                        <Text style={styles.cardDescription}>
                            오늘의 학습 내용을 기록해보세요
                        </Text>
                    </Pressable>
                )}

                {renderFeedbackHistory()}
            </ScrollView>

            <Modal
                visible={isSelfEvalModalVisible}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>자기 평가</Text>
                            <Pressable onPress={() => setSelfEvalModalVisible(false)}>
                                <Icon name="x" size={24} color="#333" />
                            </Pressable>
                        </View>

                        <ScrollView>
                            <RatingStars
                                rating={selfEvaluation.understanding}
                                setRating={(value) => setSelfEvaluation({
                                    ...selfEvaluation,
                                    understanding: value
                                })}
                                label="이해도"
                            />
                            <RatingStars
                                rating={selfEvaluation.effort}
                                setRating={(value) => setSelfEvaluation({
                                    ...selfEvaluation,
                                    effort: value
                                })}
                                label="노력도"
                            />
                            <RatingStars
                                rating={selfEvaluation.efficiency}
                                setRating={(value) => setSelfEvaluation({
                                    ...selfEvaluation,
                                    efficiency: value
                                })}
                                label="효율성"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="평가 내용을 입력하세요"
                                value={selfEvaluation.notes}
                                onChangeText={(text) => setSelfEvaluation({
                                    ...selfEvaluation,
                                    notes: text
                                })}
                                multiline
                                textAlignVertical="top"
                            />

                            <Pressable
                                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                                onPress={handleSaveSelfEvaluation}
                                disabled={loading}
                            >
                                <Text style={styles.saveButtonText}>
                                    {loading ? '저장 중...' : '저장하기'}
                                </Text>
                            </Pressable>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={isJournalModalVisible}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>학습 일지</Text>
                            <Pressable onPress={() => setJournalModalVisible(false)}>
                                <Icon name="x" size={24} color="#333" />
                            </Pressable>
                        </View>

                        <ScrollView>
                            <TextInput
                                style={styles.input}
                                placeholder="오늘의 학습 내용"
                                value={studyJournal.content}
                                onChangeText={(text) => setStudyJournal({
                                    ...studyJournal,
                                    content: text
                                })}
                                multiline
                                textAlignVertical="top"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="주요 성과"
                                value={studyJournal.achievements}
                                onChangeText={(text) => setStudyJournal({
                                    ...studyJournal,
                                    achievements: text
                                })}
                                multiline
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="어려웠던 점"
                                value={studyJournal.difficulties}
                                onChangeText={(text) => setStudyJournal({
                                    ...studyJournal,
                                    difficulties: text
                                })}
                                multiline
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="개선할 점"
                                value={studyJournal.improvements}
                                onChangeText={(text) => setStudyJournal({
                                    ...studyJournal,
                                    improvements: text
                                })}
                                multiline
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="다음 학습 목표"
                                value={studyJournal.nextGoals}
                                onChangeText={(text) => setStudyJournal({
                                    ...studyJournal,
                                    nextGoals: text
                                })}
                                multiline
                            />

                            <Pressable
                                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                                onPress={handleSaveJournal}
                                disabled={loading}
                            >
                                <Text style={styles.saveButtonText}>
                                    {loading ? '저장 중...' : '저장하기'}
                                </Text>
                            </Pressable>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    headerRight: {
        width: 24,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#4A90E2',
    },
    tabText: {
        fontSize: 16,
        color: '#666',
    },
    activeTabText: {
        color: '#4A90E2',
        fontWeight: '500',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    feedbackCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    cardDescription: {
        color: '#666',
        fontSize: 14,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        height: 100,
        fontSize: 16,
        textAlignVertical: 'top',
    },
    ratingContainer: {
        marginBottom: 16,
    },
    ratingLabel: {
        fontSize: 16,
        marginBottom: 8,
    },
    starsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starButton: {
        padding: 4,
    },
    saveButton: {
        backgroundColor: '#4A90E2',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    historySection: {
        marginTop: 24,
    },
    historyTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    historyItem: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    historyDate: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    historyContent: {
        fontSize: 14,
    }
});

export default StudyFeedbackScreen;