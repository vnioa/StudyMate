// screens/mypage/SettingsScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    Switch,
    TouchableOpacity,
    Alert,
    StyleSheet,
    Platform,
    Dimensions,
    Modal,
    Slider,
    ActivityIndicator, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import { API_URL } from '../../config/api';

const SettingsScreen = ({ navigation }) => {
    // 상태 관리
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState(null);
    const [theme, setTheme] = useState('light');
    const [language, setLanguage] = useState('ko');
    const [fontSize, setFontSize] = useState(16);
    const [locationEnabled, setLocationEnabled] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [privateAccount, setPrivateAccount] = useState(false);
    const [syncEnabled, setSyncEnabled] = useState(false);
    const [storageLocation, setStorageLocation] = useState('local');
    const [highContrastMode, setHighContrastMode] = useState(false);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showShortcutModal, setShowShortcutModal] = useState(false);
    const [shortcuts, setShortcuts] = useState({});
    const [dataBackupProgress, setDataBackupProgress] = useState(0);
    const [isBackingUp, setIsBackingUp] = useState(false);

    // 색상 테마
    const colors = {
        primary: '#4A90E2',
        secondary: '#F5A623',
        background: '#F8F8F8',
        text: '#333333',
        textSecondary: '#757575',
        cardBackground: '#FFFFFF',
        error: '#FF3B30',
        success: '#4CD964',
        border: '#EEEEEE',
    };

    // 초기화
    useEffect(() => {
        const initializeSettings = async () => {
            const storedUserId = await AsyncStorage.getItem('userId');
            setUserId(storedUserId);
            await loadSettings(storedUserId);
            await checkPermissions();
        };
        initializeSettings();
    }, []);

    // API 호출 함수들
    const fetchSettings = async (userId) => {
        try {
            const response = await axios.get(`${API_URL}/settings/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Settings fetch error:', error);
            throw new Error('설정을 불러오는데 실패했습니다.');
        }
    };

    const updateSettings = async (userId, settings) => {
        try {
            const response = await axios.put(`${API_URL}/settings/${userId}`, settings);
            return response.data;
        } catch (error) {
            console.error('Settings update error:', error);
            throw new Error('설정 저장에 실패했습니다.');
        }
    };

    const backupToServer = async (userId, data) => {
        try {
            const response = await axios.post(
                `${API_URL}/backup/${userId}`,
                data,
                {
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setDataBackupProgress(percentCompleted);
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Backup error:', error);
            throw new Error('백업에 실패했습니다.');
        }
    };

    const restoreFromServer = async (userId) => {
        try {
            const response = await axios.get(`${API_URL}/backup/${userId}/restore`);
            return response.data;
        } catch (error) {
            console.error('Restore error:', error);
            throw new Error('복원에 실패했습니다.');
        }
    };

    const deleteAccountFromServer = async (userId) => {
        try {
            await axios.delete(`${API_URL}/users/${userId}`);
            return true;
        } catch (error) {
            console.error('Account deletion error:', error);
            throw new Error('계정 삭제에 실패했습니다.');
        }
    };

    // 설정 로드
    const loadSettings = async (currentUserId) => {
        try {
            setIsLoading(true);
            const serverSettings = await fetchSettings(currentUserId);

            // 서버 설정 적용
            Object.entries(serverSettings).forEach(([key, value]) => {
                switch(key) {
                    case 'theme': setTheme(value); break;
                    case 'language': setLanguage(value); break;
                    case 'fontSize': setFontSize(value); break;
                    case 'locationEnabled': setLocationEnabled(value); break;
                    case 'notificationsEnabled': setNotificationsEnabled(value); break;
                    case 'privateAccount': setPrivateAccount(value); break;
                    case 'syncEnabled': setSyncEnabled(value); break;
                    case 'storageLocation': setStorageLocation(value); break;
                    case 'highContrastMode': setHighContrastMode(value); break;
                    case 'vibrationEnabled': setVibrationEnabled(value); break;
                    case 'shortcuts': setShortcuts(value); break;
                }
            });

            // 로컬 저장소 동기화
            await AsyncStorage.setItem('userSettings', JSON.stringify(serverSettings));
        } catch (error) {
            Alert.alert('오류', error.message);
            // 서버 연동 실패시 로컬 데이터 로드
            const localSettings = await AsyncStorage.getItem('userSettings');
            if (localSettings) {
                const settings = JSON.parse(localSettings);
                Object.entries(settings).forEach(([key, value]) => {
                    switch(key) {
                        case 'theme': setTheme(value); break;
                        case 'language': setLanguage(value); break;
                        case 'fontSize': setFontSize(value); break;
                        case 'locationEnabled': setLocationEnabled(value); break;
                        case 'notificationsEnabled': setNotificationsEnabled(value); break;
                        case 'privateAccount': setPrivateAccount(value); break;
                        case 'syncEnabled': setSyncEnabled(value); break;
                        case 'storageLocation': setStorageLocation(value); break;
                        case 'highContrastMode': setHighContrastMode(value); break;
                        case 'vibrationEnabled': setVibrationEnabled(value); break;
                        case 'shortcuts': setShortcuts(value); break;
                    }
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 권한 체크
    const checkPermissions = async () => {
        try {
            const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
            const { status: notificationStatus } = await Notifications.requestPermissionsAsync();

            setLocationEnabled(locationStatus === 'granted');
            setNotificationsEnabled(notificationStatus === 'granted');
        } catch (error) {
            console.error('Permissions check error:', error);
        }
    };

    // 설정 저장
    const saveSettings = async () => {
        try {
            setIsLoading(true);
            const settings = {
                theme,
                language,
                fontSize,
                locationEnabled,
                notificationsEnabled,
                privateAccount,
                syncEnabled,
                storageLocation,
                highContrastMode,
                vibrationEnabled,
                shortcuts,
            };

            // 서버에 저장
            await updateSettings(userId, settings);

            // 로컬에 저장
            await AsyncStorage.setItem('userSettings', JSON.stringify(settings));

            Alert.alert('성공', '설정이 저장되었습니다.');
        } catch (error) {
            Alert.alert('오류', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 데이터 백업
    const backupData = async () => {
        try {
            setIsLoading(true);
            setIsBackingUp(true);
            setDataBackupProgress(0);

            const settings = await AsyncStorage.getItem('userSettings');
            const backupData = {
                settings,
                timestamp: new Date().toISOString(),
            };

            if (storageLocation === 'local') {
                const backupString = JSON.stringify(backupData);
                const encrypted = await Crypto.digestStringAsync(
                    Crypto.CryptoDigestAlgorithm.SHA256,
                    backupString
                );

                await FileSystem.writeAsStringAsync(
                    `${FileSystem.documentDirectory}backup.json`,
                    encrypted
                );
            } else {
                await backupToServer(userId, backupData);
            }

            Alert.alert('성공', '백업이 완료되었습니다.');
        } catch (error) {
            Alert.alert('오류', error.message);
        } finally {
            setIsLoading(false);
            setIsBackingUp(false);
            setDataBackupProgress(0);
        }
    };

    // 데이터 복원
    const restoreData = async () => {
        try {
            setIsLoading(true);
            let backupData;

            if (storageLocation === 'local') {
                const data = await FileSystem.readAsStringAsync(
                    `${FileSystem.documentDirectory}backup.json`
                );
                backupData = JSON.parse(data);
            } else {
                backupData = await restoreFromServer(userId);
            }

            if (backupData?.settings) {
                await AsyncStorage.setItem('userSettings', backupData.settings);
                await loadSettings(userId);
                Alert.alert('성공', '복원이 완료되었습니다.');
            }
        } catch (error) {
            Alert.alert('오류', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 계정 삭제
    const deleteAccount = async () => {
        try {
            const auth = await LocalAuthentication.authenticateAsync({
                promptMessage: '계정 삭제를 위해 인증해주세요.',
                fallbackLabel: '생체인증을 사용할 수 없습니다.',
            });

            if (auth.success) {
                setIsLoading(true);
                await deleteAccountFromServer(userId);
                await AsyncStorage.clear();
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            }
        } catch (error) {
            Alert.alert('오류', error.message);
        } finally {
            setIsLoading(false);
            setShowDeleteModal(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

            {/* 상단 바 */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>설정</Text>
                <TouchableOpacity onPress={saveSettings} style={styles.saveButton}>
                    <MaterialIcons name="save" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    {isBackingUp && (
                        <Text style={styles.progressText}>
                            백업 진행중... {dataBackupProgress}%
                        </Text>
                    )}
                </View>
            ) : (
                <ScrollView style={styles.scrollView}>
                    {/* 앱 테마 및 언어 설정 */}
                    <View style={[styles.section, { backgroundColor: '#F8F8F8' }]}>
                        <Text style={styles.sectionTitle}>앱 테마 및 언어</Text>
                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>테마</Text>
                            <Switch
                                value={theme === 'dark'}
                                onValueChange={(value) => setTheme(value ? 'dark' : 'light')}
                            />
                        </View>
                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>언어</Text>
                            <TouchableOpacity
                                style={styles.languageButton}
                                onPress={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
                            >
                                <Text style={styles.buttonText}>
                                    {language === 'ko' ? '한국어' : 'English'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 개인정보 보호 설정 */}
                    <View style={[styles.section, { backgroundColor: '#E8F5E9' }]}>
                        <Text style={styles.sectionTitle}>개인정보 보호</Text>
                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>위치 서비스</Text>
                            <Switch
                                value={locationEnabled}
                                onValueChange={setLocationEnabled}
                            />
                        </View>
                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>알림</Text>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                            />
                        </View>
                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>계정 비공개</Text>
                            <Switch
                                value={privateAccount}
                                onValueChange={setPrivateAccount}
                            />
                        </View>
                    </View>

                    {/* 데이터 백업 및 복원 */}
                    <View style={[styles.section, { backgroundColor: '#FFF3E0' }]}>
                        <Text style={styles.sectionTitle}>데이터 백업 및 복원</Text>
                        <View style={styles.settingItem}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={backupData}
                            >
                                <Text style={styles.actionButtonText}>데이터 백업</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.settingItem}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={restoreData}
                            >
                                <Text style={styles.actionButtonText}>데이터 복원</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 계정 관리 */}
                    <View style={[styles.section, { backgroundColor: '#E1F5FE' }]}>
                        <Text style={styles.sectionTitle}>계정 관리</Text>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={() => setShowDeleteModal(true)}
                        >
                            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                                계정 삭제
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* 멀티디바이스 동기화 */}
                    <View style={[styles.section, { backgroundColor: '#F0F4C3' }]}>
                        <Text style={styles.sectionTitle}>멀티디바이스 동기화</Text>
                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>자동 동기화</Text>
                            <Switch
                                value={syncEnabled}
                                onValueChange={setSyncEnabled}
                            />
                        </View>
                    </View>

                    {/* 접근성 설정 */}
                    <View style={[styles.section, { backgroundColor: '#FFF3E0' }]}>
                        <Text style={styles.sectionTitle}>접근성</Text>
                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>고대비 모드</Text>
                            <Switch
                                value={highContrastMode}
                                onValueChange={setHighContrastMode}
                            />
                        </View>
                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>진동 알림</Text>
                            <Switch
                                value={vibrationEnabled}
                                onValueChange={setVibrationEnabled}
                            />
                        </View>
                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>글꼴 크기</Text>
                            <Slider
                                style={styles.slider}
                                minimumValue={12}
                                maximumValue={24}
                                step={1}
                                value={fontSize}
                                onValueChange={setFontSize}
                            />
                        </View>
                    </View>

                    {/* 하단 버튼 */}
                    <View style={styles.bottomButtons}>
                        <TouchableOpacity
                            style={[styles.button, styles.resetButton]}
                            onPress={() => {
                                Alert.alert(
                                    '설정 초기화',
                                    '모든 설정을 초기화하시겠습니까?',
                                    [
                                        { text: '취소', style: 'cancel' },
                                        {
                                            text: '확인',
                                            onPress: async () => {
                                                await AsyncStorage.removeItem('userSettings');
                                                await loadSettings(userId);
                                            }
                                        }
                                    ]
                                );
                            }}
                        >
                            <Text style={styles.buttonText}>초기화</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.buttonText}>취소</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}

            {/* 계정 삭제 모달 */}
            <Modal
                visible={showDeleteModal}
                transparent
                animationType="fade"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>계정 삭제</Text>
                        <Text style={styles.modalText}>
                            정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowDeleteModal(false)}
                            >
                                <Text style={styles.buttonText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.deleteButton]}
                                onPress={deleteAccount}
                            >
                                <Text style={styles.buttonText}>삭제</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333333',
    },
    saveButton: {
        padding: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressText: {
        marginTop: 16,
        fontSize: 16,
        color: '#333333',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        margin: 16,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 16,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    settingLabel: {
        fontSize: 16,
        color: '#333333',
    },
    languageButton: {
        padding: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
    },
    actionButton: {
        padding: 12,
        backgroundColor: '#4A90E2',
        borderRadius: 8,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
    },
    deleteButtonText: {
        color: '#FFFFFF',
    },
    slider: {
        width: 200,
        height: 40,
    },
    bottomButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        marginBottom: 16,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        minWidth: 120,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    resetButton: {
        backgroundColor: '#FF3B30',
    },
    cancelButton: {
        backgroundColor: '#757575',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 24,
        width: '80%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333333',
    },
    modalText: {
        fontSize: 16,
        color: '#666666',
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        marginHorizontal: 8,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
});

export default SettingsScreen;