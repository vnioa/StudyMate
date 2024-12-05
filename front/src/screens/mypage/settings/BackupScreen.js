import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    Alert,
    ActivityIndicator,
    ScrollView,
    RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { backupAPI } from '../../../services/api';

const BackupScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [backupSettings, setBackupSettings] = useState({
        isAutoBackup: false,
        lastBackupDate: null,
        backupSize: 0,
        backupInterval: 'daily',
        backupHistory: []
    });

    useEffect(() => {
        fetchBackupSettings();
    }, []);

    const fetchBackupSettings = async () => {
        try {
            setLoading(true);
            const response = await backupAPI.getSettings();
            if (response.data) {
                setBackupSettings(response.data);
            }
        } catch (error) {
            Alert.alert('오류', '설정을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleToggleAutoBackup = async (value) => {
        try {
            setLoading(true);
            const response = await backupAPI.updateSettings({
                isAutoBackup: value,
                backupInterval: backupSettings.backupInterval
            });
            if (response.data.success) {
                setBackupSettings(prev => ({
                    ...prev,
                    isAutoBackup: value
                }));
                Alert.alert('성공', '자동 백업 설정이 변경되었습니다.');
            }
        } catch (error) {
            Alert.alert('오류', '자동 백업 설정 변경에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackupIntervalChange = async (interval) => {
        try {
            setLoading(true);
            const response = await backupAPI.updateSettings({
                isAutoBackup: backupSettings.isAutoBackup,
                backupInterval: interval
            });
            if (response.data.success) {
                setBackupSettings(prev => ({
                    ...prev,
                    backupInterval: interval
                }));
                Alert.alert('성공', '백업 주기가 변경되었습니다.');
            }
        } catch (error) {
            Alert.alert('오류', '백업 주기 변경에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackup = async () => {
        try {
            setLoading(true);
            const response = await backupAPI.createBackup();
            if (response.data.success) {
                Alert.alert('성공', '백업이 완료되었습니다.');
                await fetchBackupSettings();
            }
        } catch (error) {
            Alert.alert('오류', '백업에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (backupId) => {
        Alert.alert(
            '복원',
            '정말로 복원하시겠습니까? 현재 데이터가 백업 데이터로 대체됩니다.',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '복원',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const response = await backupAPI.restore(backupId);
                            if (response.data.success) {
                                Alert.alert('성공', '복원이 완료되었습니다.');
                                await fetchBackupSettings();
                            }
                        } catch (error) {
                            Alert.alert('오류', '복원에 실패했습니다.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading && !backupSettings.lastBackupDate) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>백업 및 복원</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={fetchBackupSettings}
                        colors={['#4A90E2']}
                    />
                }
            >
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>백업 설정</Text>
                    <View style={styles.settingItem}>
                        <Text style={styles.settingTitle}>자동 백업</Text>
                        <Switch
                            value={backupSettings.isAutoBackup}
                            onValueChange={handleToggleAutoBackup}
                            trackColor={{ false: "#767577", true: "#4A90E2" }}
                        />
                    </View>

                    {backupSettings.isAutoBackup && (
                        <View style={styles.intervalContainer}>
                            {['daily', 'weekly', 'monthly'].map((interval) => (
                                <TouchableOpacity
                                    key={interval}
                                    style={[
                                        styles.intervalButton,
                                        backupSettings.backupInterval === interval && styles.intervalButtonActive
                                    ]}
                                    onPress={() => handleBackupIntervalChange(interval)}
                                >
                                    <Text style={[
                                        styles.intervalButtonText,
                                        backupSettings.backupInterval === interval && styles.intervalButtonTextActive
                                    ]}>
                                        {interval === 'daily' ? '매일' :
                                            interval === 'weekly' ? '매주' : '매월'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>백업 정보</Text>
                    {backupSettings.lastBackupDate && (
                        <>
                            <Text style={styles.infoText}>
                                마지막 백업: {new Date(backupSettings.lastBackupDate).toLocaleString()}
                            </Text>
                            <Text style={styles.infoText}>
                                백업 크기: {formatBytes(backupSettings.backupSize)}
                            </Text>
                        </>
                    )}

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleBackup}
                        disabled={loading}
                    >
                        <Icon name="save" size={20} color="#fff" style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>백업 시작</Text>
                    </TouchableOpacity>
                </View>

                {backupSettings.backupHistory.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>백업 기록</Text>
                        {backupSettings.backupHistory.map((backup) => (
                            <View key={backup.id} style={styles.historyItem}>
                                <View style={styles.historyInfo}>
                                    <Text style={styles.historyDate}>
                                        {new Date(backup.date).toLocaleString()}
                                    </Text>
                                    <Text style={styles.historySize}>
                                        {formatBytes(backup.size)}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.restoreButton}
                                    onPress={() => handleRestore(backup.id)}
                                    disabled={loading}
                                >
                                    <Icon name="refresh-cw" size={16} color="#4A90E2" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
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
    content: {
        flex: 1,
        padding: 16,
    },
    card: {
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
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
        color: '#333',
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    settingTitle: {
        fontSize: 16,
        color: '#333',
    },
    intervalContainer: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 8,
    },
    intervalButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#f1f3f5',
        alignItems: 'center',
    },
    intervalButtonActive: {
        backgroundColor: '#4A90E2',
    },
    intervalButtonText: {
        color: '#666',
        fontSize: 14,
    },
    intervalButtonTextActive: {
        color: '#fff',
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    button: {
        flexDirection: 'row',
        backgroundColor: '#4A90E2',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    historyInfo: {
        flex: 1,
    },
    historyDate: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    historySize: {
        fontSize: 12,
        color: '#666',
    },
    restoreButton: {
        padding: 8,
    }
});

export default BackupScreen;