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
import { settingsAPI } from '../../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsBackupScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [backupInfo, setBackupInfo] = useState({
        autoBackup: false,
        lastBackupDate: null,
        backupLocation: 'cloud',
        backupSize: 0,
        backupInterval: 'daily',
        lastSyncDate: null
    });

    useEffect(() => {
        fetchBackupSettings();
    }, []);

    const fetchBackupSettings = async () => {
        try {
            setLoading(true);
            const response = await settingsAPI.getBackupSettings();
            if (response.data) {
                setBackupInfo(response.data);
                await AsyncStorage.setItem('backupSettings', JSON.stringify(response.data));
            }
        } catch (error) {
            Alert.alert('오류', '설정을 불러오는데 실패했습니다.');
            // Fallback to cached settings
            const cachedSettings = await AsyncStorage.getItem('backupSettings');
            if (cachedSettings) {
                setBackupInfo(JSON.parse(cachedSettings));
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleAutoBackupToggle = async (value) => {
        try {
            setLoading(true);
            const response = await settingsAPI.updateAutoBackup({
                enabled: value,
                interval: backupInfo.backupInterval
            });

            if (response.data.success) {
                setBackupInfo(prev => ({
                    ...prev,
                    autoBackup: value
                }));
                await AsyncStorage.setItem('backupSettings', JSON.stringify({
                    ...backupInfo,
                    autoBackup: value
                }));
            }
        } catch (error) {
            Alert.alert('오류', '자동 백업 설정 변경에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackup = async () => {
        try {
            setLoading(true);
            const response = await settingsAPI.backupSettings();
            if (response.data.success) {
                const newBackupInfo = {
                    ...backupInfo,
                    lastBackupDate: new Date().toISOString(),
                    backupSize: response.data.backupSize
                };
                setBackupInfo(newBackupInfo);
                await AsyncStorage.setItem('backupSettings', JSON.stringify(newBackupInfo));
                Alert.alert('성공', '설정이 백업되었습니다.');
            }
        } catch (error) {
            Alert.alert('오류', '백업에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        Alert.alert(
            '설정 복원',
            '이전 백업에서 설정을 복원하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '복원',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const response = await settingsAPI.restoreSettings();
                            if (response.data.success) {
                                Alert.alert('성공', '설정이 복원되었습니다.');
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
        if (!isFinite(bytes) || bytes < 0) return '0 Bytes';
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.min(3, Math.floor(Math.log(bytes) / Math.log(k)));
        const value = bytes / Math.pow(k, i);
        return (isFinite(value) ? value.toFixed(2) : '0') + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading && !backupInfo.lastBackupDate) {
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
                <Text style={styles.headerTitle}>설정 백업 및 복원</Text>
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
                <View style={styles.settingItem}>
                    <View style={styles.settingInfo}>
                        <Text style={styles.settingTitle}>자동 백업</Text>
                        <Text style={styles.settingDescription}>
                            설정을 자동으로 백업합니다
                        </Text>
                    </View>
                    <Switch
                        value={backupInfo.autoBackup}
                        onValueChange={handleAutoBackupToggle}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                        thumbColor={backupInfo.autoBackup ? "#fff" : "#f4f3f4"}
                        disabled={loading}
                    />
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.backupButton, loading && styles.buttonDisabled]}
                        onPress={handleBackup}
                        disabled={loading}
                    >
                        <Icon name="upload" size={20} color="#fff" style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>설정 백업</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.restoreButton, loading && styles.buttonDisabled]}
                        onPress={handleRestore}
                        disabled={loading}
                    >
                        <Icon name="download" size={20} color="#fff" style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>설정 복원</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.infoTitle}>백업 정보</Text>
                    <Text style={styles.infoText}>
                        마지막 백업: {formatDate(backupInfo.lastBackupDate)}
                    </Text>
                    <Text style={styles.infoText}>
                        백업 크기: {formatBytes(backupInfo.backupSize)}
                    </Text>
                    <Text style={styles.infoText}>
                        백업 위치: {backupInfo.backupLocation === 'cloud' ? '클라우드' : '로컬'}
                    </Text>
                    {backupInfo.lastSyncDate && (
                        <Text style={styles.infoText}>
                            마지막 동기화: {formatDate(backupInfo.lastSyncDate)}
                        </Text>
                    )}
                </View>
            </ScrollView>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                </View>
            )}
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
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
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
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
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
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        color: '#333',
    },
    settingDescription: {
        fontSize: 14,
        color: '#666',
    },
    buttonContainer: {
        marginVertical: 16,
        gap: 12,
    },
    button: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    backupButton: {
        backgroundColor: '#4A90E2',
    },
    restoreButton: {
        backgroundColor: '#666',
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    infoContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333',
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    }
});

export default SettingsBackupScreen;