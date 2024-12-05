import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    TextInput,
    Switch,
    ScrollView,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import BackgroundTimer from 'react-native-background-timer';
import * as Notifications from 'expo-notifications';
import { studyAPI } from '../../services/api';
import theme from "../../styles/theme";

const StudySessionScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25분
    const [isBreakTime, setIsBreakTime] = useState(false);
    const [cycles, setCycles] = useState(0);
    const [focusMode, setFocusMode] = useState({
        notifications: false,
        backgroundMusic: false,
        screenLock: false
    });
    const [sessionNotes, setSessionNotes] = useState('');
    const [isModalVisible, setModalVisible] = useState(false);
    const [sessionStats, setSessionStats] = useState({
        totalTime: 0,
        completedCycles: 0,
        averageFocusTime: 0
    });
    const [chartLoading, setChartLoading] = useState(true);
    const [progressWidth, setProgressWidth] = useState('0%');

    useEffect(() => {
        const width = Math.min(Math.round((cycles / 4) * 100), 100);
        setProgressWidth(`${width}%`);
        setChartLoading(false);
    }, [cycles]);

    useEffect(() => {
        setupNotifications();
        fetchSessionStats();
        return () => {
            if (isTimerRunning) {
                handleEndSession();
            }
        };
    }, []);

    const setupNotifications = async () => {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('알림 권한이 필요합니다');
            }
        } catch (error) {
            console.error('Notification setup failed:', error);
        }
    };

    const fetchSessionStats = async () => {
        try {
            setLoading(true);
            const response = await studyAPI.getSessionStats();
            if (response.data) {
                setSessionStats(response.data);
            }
        } catch (error) {
            Alert.alert('오류', '통계 데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        let interval;
        if (isTimerRunning) {
            interval = BackgroundTimer.setInterval(() => {
                setTimeLeft((prevTime) => {
                    if (prevTime <= 1) {
                        handleTimerComplete();
                        return isBreakTime ? 25 * 60 : 5 * 60;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        }
        return () => {
            if (interval) {
                BackgroundTimer.clearInterval(interval);
            }
        };
    }, [isTimerRunning, isBreakTime]);

    const handleTimerComplete = async () => {
        try {
            setIsTimerRunning(false);
            if (!isBreakTime) {
                const newCycles = cycles + 1;
                setCycles(newCycles);
                await studyAPI.updateCycles({
                    cycles: newCycles,
                    timestamp: new Date().toISOString()
                });
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: '포모도로 완료!',
                        body: '휴식 시간입니다.',
                        data: { cycles: newCycles }
                    },
                    trigger: null,
                });
            }
            setIsBreakTime(!isBreakTime);
        } catch (error) {
            Alert.alert('오류', '세션 업데이트에 실패했습니다.');
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleEndSession = async () => {
        try {
            setLoading(true);
            const sessionData = {
                cycles,
                notes: sessionNotes,
                totalTime: (25 * cycles) + Math.floor((25 * 60 - timeLeft) / 60),
                focusMode,
                endTime: new Date().toISOString()
            };
            
            const response = await studyAPI.endStudySession(sessionData);
            
            if (response.success) {
                setModalVisible(true);
                await fetchSessionStats();
            }
        } catch (error) {
            Alert.alert('오류', '세션 종료에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAndExit = async () => {
        try {
            setLoading(true);
            await studyAPI.saveNotes({
                notes: sessionNotes,
                sessionId: new Date().toISOString()
            });
            navigation.goBack();
        } catch (error) {
            Alert.alert('오류', '노트 저장에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchSessionStats();
    };

    if (loading && !sessionStats.totalTime) {
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
                <Text style={styles.headerTitle}>학습 세션</Text>
                <View style={{ width: 24 }} />
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
                <View style={styles.timerSection}>
                    <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                    <Text style={styles.cycleText}>
                        {isBreakTime ? '휴식 시간' : '집중 시간'} • {cycles}/4 사이클
                    </Text>
                    <Pressable
                        style={[styles.timerButton, isTimerRunning && styles.timerButtonActive]}
                        onPress={() => setIsTimerRunning(!isTimerRunning)}
                    >
                        <Icon
                            name={isTimerRunning ? 'pause' : 'play'}
                            size={24}
                            color="#fff"
                        />
                    </Pressable>
                </View>

                <View style={styles.statsSection}>
                    <Text style={styles.sectionTitle}>오늘의 통계</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{sessionStats.totalTime}분</Text>
                            <Text style={styles.statLabel}>총 학습 시간</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{sessionStats.completedCycles}</Text>
                            <Text style={styles.statLabel}>완료한 사이클</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{sessionStats.averageFocusTime}분</Text>
                            <Text style={styles.statLabel}>평균 집중 시간</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.settingsSection}>
                    <Text style={styles.sectionTitle}>집중 모드 설정</Text>
                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>알림 차단</Text>
                        <Switch
                            value={focusMode.notifications}
                            onValueChange={(value) => setFocusMode(prev => ({...prev, notifications: value}))}
                        />
                    </View>
                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>배경음</Text>
                        <Switch
                            value={focusMode.backgroundMusic}
                            onValueChange={(value) => setFocusMode(prev => ({...prev, backgroundMusic: value}))}
                        />
                    </View>
                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>화면 잠금</Text>
                        <Switch
                            value={focusMode.screenLock}
                            onValueChange={(value) => setFocusMode(prev => ({...prev, screenLock: value}))}
                        />
                    </View>
                </View>

                <View style={styles.progressSection}>
                    <Text style={styles.sectionTitle}>학습 진행 상황</Text>
                    <View style={styles.progressBar}>
                        {!chartLoading && (
                            <View style={styles.progressBar}>
                                <View style={[
                                    styles.progressFill,
                                    { width: progressWidth }
                                ]} />
                            </View>
                        )}
                    </View>
                    <Text style={styles.progressText}>
                        오늘의 목표: 4 포모도로 중 {cycles}개 완료
                    </Text>
                </View>
            </ScrollView>

            <Pressable
                style={styles.endButton}
                onPress={handleEndSession}
            >
                <Text style={styles.endButtonText}>세션 종료</Text>
            </Pressable>

            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>학습 세션 리뷰</Text>
                            <Pressable onPress={() => setModalVisible(false)}>
                                <Icon name="x" size={24} color="#333" />
                            </Pressable>
                        </View>

                        <Text style={styles.modalLabel}>학습 내용 기록</Text>
                        <TextInput
                            style={styles.noteInput}
                            multiline
                            placeholder="오늘의 학습 내용을 기록해주세요"
                            value={sessionNotes}
                            onChangeText={setSessionNotes}
                        />

                        <View style={styles.sessionSummary}>
                            <Text style={styles.summaryTitle}>세션 요약</Text>
                            <Text style={styles.summaryText}>
                                완료한 포모도로: {cycles}
                            </Text>
                            <Text style={styles.summaryText}>
                                총 학습 시간: {cycles * 25}분
                            </Text>
                        </View>

                        <Pressable
                            style={styles.saveButton}
                            onPress={handleSaveAndExit}
                        >
                            <Text style={styles.saveButtonText}>
                                저장하고 종료
                            </Text>
                        </Pressable>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    searchSection: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 8,
        marginLeft: 8,
    },
    selectedTagsContainer: {
        padding: 12,
        backgroundColor: '#fff',
    },
    selectedTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4A90E2',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        marginRight: 8,
    },
    selectedTagText: {
        color: '#fff',
        marginRight: 6,
    },
    materialsList: {
        padding: 16,
    },
    materialItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    materialInfo: {
        flex: 1,
    },
    materialTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    materialDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    tag: {
        backgroundColor: '#f0f0f0',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        marginRight: 8,
        marginBottom: 4,
    },
    tagText: {
        fontSize: 12,
        color: '#666',
    },
    materialActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
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
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        marginTop: 4,
    },
    tagsScrollView: {
        marginBottom: 16,
    },
    tagChoice: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
    },
    tagChoiceSelected: {
        backgroundColor: '#4A90E2',
    },
    tagChoiceText: {
        color: '#666',
    },
    tagChoiceTextSelected: {
        color: '#fff',
    },
    uploadButton: {
        backgroundColor: '#4A90E2',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    uploadButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    filePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    filePickerText: {
        marginLeft: 8,
        color: '#666',
        fontSize: 14,
    },
    selectedFileName: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    timerSection: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        margin: 16,
        ...Platform.select({
            ios: theme.shadows.medium,
            android: { elevation: 3 }
        }),
    },
    timerText: {
        fontSize: 48,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    cycleText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 16,
    },
    timerButton: {
        backgroundColor: '#4A90E2',
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timerButtonActive: {
        backgroundColor: '#E74C3C',
    },
    statsSection: {
        padding: 16,
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4A90E2',
        borderRadius: 4,
    },
    endButton: {
        backgroundColor: '#4A90E2',
        padding: 16,
        margin: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    endButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalLabel: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333',
    },
    noteInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        height: 120,
        marginBottom: 16,
        textAlignVertical: 'top',
    },
    sessionSummary: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    summaryText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    saveButton: {
        backgroundColor: '#4A90E2',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
        ...Platform.select({
            ios: theme.shadows.medium,
            android: { elevation: 3 }
        }),
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default StudySessionScreen;