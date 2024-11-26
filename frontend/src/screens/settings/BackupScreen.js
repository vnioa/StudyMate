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
import { backupAPI } from '../../services/api';

const BackupScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [backupSettings, setBackupSettings] = useState({
        isAutoBackup: false,
        lastBackupDate: null,
        backupSize: 0
    });

    useEffect(() => {
        fetchBackupSettings();
    }, []);

    const fetchBackupSettings = async () => {
        try {
            const response = await backupAPI.getSettings();
            setBackupSettings(response.data);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '설정을 불러오는데 실패했습니다.');
        }
    };

    const handleToggleAutoBackup = async (value) => {
        try {
            const response = await backupAPI.updateSettings({ isAutoBackup: value });
            if (response.data.success) {
                setBackupSettings(prev => ({
                    ...prev,
                    isAutoBackup: value
                }));
            }
        } catch (error) {
            Alert.alert('오류', '자동 백업 설정 변경에 실패했습니다.');
        }
    };

    const handleBackup = async () => {
        try {
            setLoading(true);
            const response = await backupAPI.createBackup();
            if (response.data.success) {
                Alert.alert('성공', '백업이 완료되었습니다.');
                fetchBackupSettings();
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '백업에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
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
                            const response = await backupAPI.restore();
                            if (response.data.success) {
                                Alert.alert('성공', '복원이 완료되었습니다.');
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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>백업 및 복원</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.settingItem}>
                    <Text style={styles.settingTitle}>자동 백업</Text>
                    <Switch
                        value={backupSettings.isAutoBackup}
                        onValueChange={handleToggleAutoBackup}
                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                    />
                </View>

                {backupSettings.lastBackupDate && (
                    <Text style={styles.lastBackup}>
                        마지막 백업: {new Date(backupSettings.lastBackupDate).toLocaleString()}
                    </Text>
                )}

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleBackup}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>백업 시작</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.restoreButton, loading && styles.buttonDisabled]}
                    onPress={handleRestore}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>복원</Text>
                </TouchableOpacity>
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
    lastBackup: {
        fontSize: 14,
        color: '#666',
        marginTop: 10,
    },
    button: {
        backgroundColor: '#4A90E2',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    restoreButton: {
        backgroundColor: '#767577',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default BackupScreen;