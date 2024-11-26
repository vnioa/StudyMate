import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    Alert,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { settingsAPI } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsBackupScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [backupInfo, setBackupInfo] = useState({
        autoBackup: false,
        lastBackupDate: null,
        backupLocation: 'cloud'
    });

    useEffect(() => {
        fetchBackupSettings();
    }, []);

    const fetchBackupSettings = async () => {
        try {
            const response = await settingsAPI.getBackupSettings();
            setBackupInfo(response.data);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '설정을 불러오는데 실패했습니다.');
        }
    };

    const handleAutoBackupToggle = async (value) => {
        try {
            setLoading(true);
            const response = await settingsAPI.updateAutoBackup(value);
            if (response.data.success) {
                setBackupInfo(prev => ({
                    ...prev,
                    autoBackup: value
                }));
                await AsyncStorage.setItem('autoBackup', value.toString());
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
                setBackupInfo(prev => ({
                    ...prev,
                    lastBackupDate: new Date().toISOString()
                }));
                Alert.alert('성공', '설정이 백업되었습니다.');
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '백업에 실패했습니다.');
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
                                fetchBackupSettings();
                            }
                        } catch (error) {
                            Alert.alert('오류', error.response?.data?.message || '복원에 실패했습니다.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>설정 백업 및 복원</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.settingItem}>
                    <Text style={styles.settingTitle}>자동 백업</Text>
                    <Switch
                        value={backupInfo.autoBackup}
                        onValueChange={handleAutoBackupToggle}
                        trackColor={{ false: "#767577", true: "#0066FF" }}
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
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Icon name="upload" size={20} color="#fff" style={styles.buttonIcon} />
                                <Text style={styles.buttonText}>설정 백업</Text>
                            </>
                        )}
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
                        백업 위치: {backupInfo.backupLocation === 'cloud' ? '클라우드' : '로컬'}
                    </Text>
                </View>
            </View>
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
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    settingTitle: {
        fontSize: 16,
        color: '#333',
    },
    buttonContainer: {
        marginTop: 30,
        gap: 15,
    },
    button: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
        borderRadius: 8,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    backupButton: {
        backgroundColor: '#0066FF',
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
        marginTop: 30,
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
});

export default SettingsBackupScreen;