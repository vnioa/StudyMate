import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { backupAPI } from '../../../services/api';

const ChatBackupRestoreScreen = () => {
    const navigation = useNavigation();
    const [lastBackupDate, setLastBackupDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [backupInProgress, setBackupInProgress] = useState(false);
    const [restoreInProgress, setRestoreInProgress] = useState(false);

    useEffect(() => {
        fetchLastBackupInfo();
    }, []);

    const fetchLastBackupInfo = async () => {
        try {
            setLoading(true);
            const response = await backupAPI.getLastBackup();
            if (response.lastBackup) {  // .data 제거
                setLastBackupDate(new Date(response.lastBackup.date).toLocaleString());
            }
        } catch (error) {
            Alert.alert('오류', error.message || '백업 정보를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const checkBackupStatus = useCallback(async () => {
        if (!backupInProgress && !restoreInProgress) return;

        try {
            const response = await backupAPI.getBackupStatus();
            if (response.completed) {
                setBackupInProgress(false);
                setRestoreInProgress(false);
                await fetchLastBackupInfo();
            }
        } catch (error) {
            console.error('백업 상태 확인 실패:', error);
        }
    }, [backupInProgress, restoreInProgress]);

    useEffect(() => {
        const statusInterval = setInterval(checkBackupStatus, 5000);
        return () => clearInterval(statusInterval);
    }, [checkBackupStatus]);

    const handleBackup = async () => {
        Alert.alert(
            '백업',
            '새로운 백업을 생성하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '백업',
                    onPress: async () => {
                        try {
                            setBackupInProgress(true);
                            await backupAPI.createBackup();
                            setLastBackupDate(new Date().toLocaleString());
                            Alert.alert('성공', '채팅 내용이 성공적으로 백업되었습니다.');
                        } catch (error) {
                            Alert.alert('오류', error.message || '백업 중 문제가 발생했습니다.');
                        } finally {
                            setBackupInProgress(false);
                        }
                    }
                }
            ]
        );
    };

    const handleRestore = async () => {
        Alert.alert(
            '복원',
            '정말로 채팅 내용을 복원하시겠습니까? 현재의 채팅 내용이 백업 시점의 내용으로 대체됩니다.',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '복원',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setRestoreInProgress(true);
                            await backupAPI.restoreFromBackup();  // response.status 체크 제거
                            Alert.alert('성공', '채팅 내용이 성공적으로 복원되었습니다.');
                        } catch (error) {
                            Alert.alert('오류', error.message || '복원 중 문제가 발생했습니다.');
                        } finally {
                            setRestoreInProgress(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>채팅 백업 및 복원</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.infoBox}>
                    {loading ? (
                        <ActivityIndicator color="#4A90E2" />
                    ) : (
                        <Text style={styles.infoText}>
                            마지막 백업: {lastBackupDate || '백업 이력 없음'}
                        </Text>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.button, backupInProgress && styles.buttonDisabled]}
                    onPress={handleBackup}
                    disabled={backupInProgress}
                >
                    {backupInProgress ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Icon name="upload-cloud" size={24} color="#fff" />
                            <Text style={styles.buttonText}>지금 백업하기</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, restoreInProgress && styles.buttonDisabled]}
                    onPress={handleRestore}
                    disabled={restoreInProgress || !lastBackupDate}
                >
                    {restoreInProgress ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Icon name="download-cloud" size={24} color="#fff" />
                            <Text style={styles.buttonText}>백업파일에서 복원하기</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.noteBox}>
                    <Text style={styles.noteTitle}>주의사항</Text>
                    <Text style={styles.noteText}>
                        • 복원 시 현재의 채팅 내용이 백업 시점의 내용으로 대체됩니다.{'\n'}
                        • 중요한 정보가 있다면 먼저 백업을 진행해주세요.{'\n'}
                        • 백업 및 복원 중에는 앱을 종료하지 마세요.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    infoBox: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
    },
    infoText: {
        fontSize: 16,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4A90E2',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    noteBox: {
        backgroundColor: '#FFF9C4',
        padding: 15,
        borderRadius: 8,
        marginTop: 20,
    },
    noteText: {
        fontSize: 14,
        color: '#333',
    },
    backButton: {
        padding: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    noteTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#D32F2F',
    },
    progressBar: {
        height: 3,
        backgroundColor: '#E3F2FD',
        marginTop: 8,
        borderRadius: 1.5,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4A90E2',
        borderRadius: 1.5,
    }
});

export default ChatBackupRestoreScreen;