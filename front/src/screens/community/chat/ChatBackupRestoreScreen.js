import React, {useState, useEffect, useCallback} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { theme } from '../../../styles/theme';
import api from '../../../api/api';

const ChatBackupRestoreScreen = () => {
    const navigation = useNavigation();
    const [lastBackupDate, setLastBackupDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [backupInProgress, setBackupInProgress] = useState(false);
    const [restoreInProgress, setRestoreInProgress] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        checkNetworkAndToken();
        fetchLastBackupInfo();
    }, []);

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

    const checkNetworkAndToken = async () => {
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
            Alert.alert('네트워크 오류', '인터넷 연결을 확인해주세요.');
            return false;
        }

        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
            Alert.alert('인증 오류', '로그인이 필요합니다.');
            navigation.navigate('Login');
            return false;
        }

        return true;
    };

    const fetchLastBackupInfo = async () => {
        if (!(await checkNetworkAndToken())) return;

        try {
            setLoading(true);
            const response = await api.get('/api/backup/last');
            if (response.data.success) {
                const backupInfo = response.data.lastBackup;
                if (backupInfo) {
                    setLastBackupDate(new Date(backupInfo.date).toLocaleString());
                    await AsyncStorage.setItem('lastBackupInfo', JSON.stringify(backupInfo));
                }
            }
        } catch (error) {
            const cachedBackupInfo = await AsyncStorage.getItem('lastBackupInfo');
            if (cachedBackupInfo) {
                const backupInfo = JSON.parse(cachedBackupInfo);
                setLastBackupDate(new Date(backupInfo.date).toLocaleString());
            }
            Alert.alert('오류', error.response?.data?.message || '백업 정보를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const checkBackupStatus = useCallback(async () => {
        if (!backupInProgress && !restoreInProgress) return;

        try {
            const response = await api.get('/api/backup/status');
            if (response.data.success) {
                setProgress(response.data.progress || 0);
                if (response.data.completed) {
                    setBackupInProgress(false);
                    setRestoreInProgress(false);
                    setProgress(0);
                    await fetchLastBackupInfo();
                }
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
        if (!(await checkNetworkAndToken())) return;

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
                            const response = await api.post('/api/backup/create');
                            if (response.data.success) {
                                setLastBackupDate(new Date().toLocaleString());
                                Alert.alert('성공', '채팅 내용이 성공적으로 백업되었습니다.');
                            }
                        } catch (error) {
                            Alert.alert('오류', error.response?.data?.message || '백업 중 문제가 발생했습니다.');
                        } finally {
                            setBackupInProgress(false);
                        }
                    }
                }
            ]
        );
    };

    const handleRestore = async () => {
        if (!(await checkNetworkAndToken())) return;

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
                            const response = await api.post('/api/backup/restore');
                            if (response.data.success) {
                                Alert.alert('성공', '채팅 내용이 성공적으로 복원되었습니다.');
                            }
                        } catch (error) {
                            Alert.alert('오류', error.response?.data?.message || '복원 중 문제가 발생했습니다.');
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
                    <Icon name="arrow-left" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>채팅 백업 및 복원</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.infoBox}>
                    {loading ? (
                        <ActivityIndicator color={theme.colors.primary} />
                    ) : (
                        <Text style={styles.infoText}>
                            마지막 백업: {lastBackupDate || '백업 이력 없음'}
                        </Text>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.button, backupInProgress && styles.buttonDisabled]}
                    onPress={handleBackup}
                    disabled={backupInProgress || restoreInProgress}
                >
                    {backupInProgress ? (
                        <ActivityIndicator color={theme.colors.white} />
                    ) : (
                        <>
                            <Icon name="upload-cloud" size={24} color={theme.colors.white} />
                            <Text style={styles.buttonText}>지금 백업하기</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.button,
                        (!lastBackupDate || restoreInProgress) && styles.buttonDisabled
                    ]}
                    onPress={handleRestore}
                    disabled={!lastBackupDate || backupInProgress || restoreInProgress}
                >
                    {restoreInProgress ? (
                        <ActivityIndicator color={theme.colors.white} />
                    ) : (
                        <>
                            <Icon name="download-cloud" size={24} color={theme.colors.white} />
                            <Text style={styles.buttonText}>백업파일에서 복원하기</Text>
                        </>
                    )}
                </TouchableOpacity>

                {(backupInProgress || restoreInProgress) && (
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${progress}%` }
                            ]}
                        />
                    </View>
                )}

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
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
        padding: theme.spacing.md,
    },
    infoBox: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.medium,
        marginBottom: theme.spacing.lg,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    infoText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.medium,
        marginBottom: theme.spacing.md,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    buttonText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.white,
        fontWeight: 'bold',
        marginLeft: theme.spacing.sm,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    noteBox: {
        backgroundColor: theme.colors.warning,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.medium,
        marginTop: theme.spacing.lg,
    },
    noteTitle: {
        ...theme.typography.bodyLarge,
        color: theme.colors.error,
        fontWeight: 'bold',
        marginBottom: theme.spacing.sm,
    },
    noteText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
    },
    backButton: {
        padding: theme.spacing.sm,
    },
    progressBar: {
        height: 3,
        backgroundColor: theme.colors.surface,
        marginTop: theme.spacing.sm,
        borderRadius: 1.5,
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 1.5,
    }
});

export default ChatBackupRestoreScreen;