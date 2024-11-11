// ChatBackupScreen.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Switch,
    Platform,
    StatusBar,
    Animated,
    Alert,
    ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Modal from 'react-native-modal';
import DropDownPicker from 'react-native-dropdown-picker';
import * as Progress from 'react-native-progress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/api';
import * as Haptics from "expo-haptics";
import axios from "axios";

const ChatBackupScreen = () => {
    // 상태 관리
    const [backupType, setBackupType] = useState('full'); // 'full' or 'selective'
    const [storageType, setStorageType] = useState('local'); // 'local' or 'cloud'
    const [backupInterval, setBackupInterval] = useState('daily');
    const [isBackupInProgress, setIsBackupInProgress] = useState(false);
    const [backupProgress, setBackupProgress] = useState(0);
    const [lastBackupDate, setLastBackupDate] = useState(null);
    const [showBackupOptions, setShowBackupOptions] = useState(false);
    const [selectedChats, setSelectedChats] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Redux
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);
    const chats = useSelector(state => state.chats.list);

    // Refs
    const progressBarRef = useRef(null);
    const backupAnimValue = useRef(new Animated.Value(0)).current;

    // Navigation
    const navigation = useNavigation();

    // 초기화
    useEffect(() => {
        initializeScreen();
        return () => cleanupScreen();
    }, []);

    const initializeScreen = async () => {
        try {
            await checkAuthentication();
            await loadBackupSettings();
            await checkLastBackup();
            setupBackgroundBackup();
        } catch (error) {
            console.error('Screen initialization failed:', error);
            Alert.alert('초기화 오류', '화면을 초기화하는데 실패했습니다.');
        }
    };

    const cleanupScreen = () => {
        saveBackupSettings();
    };

    // 인증 관련 함수
    const checkAuthentication = async () => {
        try {
            const { success } = await LocalAuthentication.authenticateAsync({
                promptMessage: '백업 설정에 접근하기 위해 인증이 필요합니다.',
                fallbackLabel: '비밀번호로 인증',
            });

            setIsAuthenticated(success);
            if (!success) {
                navigation.goBack();
            }
        } catch (error) {
            console.error('Authentication failed:', error);
            navigation.goBack();
        }
    };

    // 설정 로드 및 저장
    const loadBackupSettings = async () => {
        try {
            const settings = await AsyncStorage.getItem('backupSettings');
            if (settings) {
                const parsed = JSON.parse(settings);
                setBackupType(parsed.backupType);
                setStorageType(parsed.storageType);
                setBackupInterval(parsed.backupInterval);
            }
        } catch (error) {
            console.error('Failed to load backup settings:', error);
        }
    };

    const saveBackupSettings = async () => {
        try {
            const settings = {
                backupType,
                storageType,
                backupInterval
            };
            await AsyncStorage.setItem('backupSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save backup settings:', error);
        }
    };
    // 백업 관련 핵심 함수들
    const startBackup = async () => {
        try {
            setIsBackupInProgress(true);
            setBackupProgress(0);

            // 백업 시작 알림
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showBackupStartNotification();

            // 백업 데이터 준비
            const backupData = await prepareBackupData();

            // 데이터 암호화
            const encryptedData = await encryptBackupData(backupData);

            // 저장소 타입에 따른 백업 처리
            if (storageType === 'local') {
                await saveToLocalStorage(encryptedData);
            } else {
                await saveToCloudStorage(encryptedData);
            }

            // 백업 완료 처리
            await updateLastBackupDate();
            setIsBackupInProgress(false);
            setBackupProgress(1);

            // 완료 알림
            showBackupCompleteNotification();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Backup failed:', error);
            setIsBackupInProgress(false);
            Alert.alert('백업 실패', '백업 중 오류가 발생했습니다.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const prepareBackupData = async () => {
        try {
            let dataToBackup = {};

            if (backupType === 'full') {
                // 전체 백업 데이터 준비
                dataToBackup = {
                    chats: await getAllChats(),
                    media: await getAllMedia(),
                    settings: await getUserSettings()
                };
            } else {
                // 선택적 백업 데이터 준비
                dataToBackup = {
                    chats: await getSelectedChats(),
                    media: await getSelectedMedia(),
                    settings: await getUserSettings()
                };
            }

            // 증분 백업을 위한 델타 계산
            const lastBackup = await getLastBackupData();
            const delta = calculateDelta(lastBackup, dataToBackup);

            return {
                timestamp: new Date().toISOString(),
                delta: delta,
                checksum: await generateChecksum(delta)
            };
        } catch (error) {
            console.error('Failed to prepare backup data:', error);
            throw new Error('백업 데이터 준비 실패');
        }
    };

    const encryptBackupData = async (data) => {
        try {
            // AES-256 암호화 키 생성
            const key = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                user.id + new Date().toISOString()
            );

            // 데이터 암호화
            const encryptedData = await Crypto.encryptAsync(
                JSON.stringify(data),
                key,
                {
                    algorithm: Crypto.CryptoEncryptionAlgorithm.AES256
                }
            );

            return {
                data: encryptedData,
                key: key
            };
        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('데이터 암호화 실패');
        }
    };

    const saveToLocalStorage = async (encryptedData) => {
        try {
            const backupDir = `${FileSystem.documentDirectory}backups/`;
            const fileName = `backup_${new Date().toISOString()}.enc`;

            // 백업 디렉토리 생성
            await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true });

            // 파일 저장
            await FileSystem.writeAsStringAsync(
                backupDir + fileName,
                JSON.stringify(encryptedData),
                { encoding: FileSystem.EncodingType.UTF8 }
            );

            // 백업 메타데이터 저장
            await AsyncStorage.setItem('lastBackupMeta', JSON.stringify({
                path: backupDir + fileName,
                timestamp: new Date().toISOString(),
                type: backupType,
                size: encryptedData.data.length
            }));

        } catch (error) {
            console.error('Local storage save failed:', error);
            throw new Error('로컬 저장소 저장 실패');
        }
    };

    const saveToCloudStorage = async (encryptedData) => {
        try {
            const token = await AsyncStorage.getItem('userToken');

            // 청크 단위로 분할하여 업로드
            const chunks = splitIntoChunks(encryptedData.data, 1024 * 1024); // 1MB 단위
            let uploadedChunks = 0;

            for (const chunk of chunks) {
                await axios.post(
                    `${API_URL}/api/backup/upload`,
                    { chunk, index: uploadedChunks },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                uploadedChunks++;
                setBackupProgress(uploadedChunks / chunks.length);
            }

            // 백업 완료 확인
            await axios.post(
                `${API_URL}/api/backup/complete`,
                {
                    checksum: await generateChecksum(encryptedData.data),
                    timestamp: new Date().toISOString()
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

        } catch (error) {
            console.error('Cloud storage save failed:', error);
            throw new Error('클라우드 저장소 저장 실패');
        }
    };

    // 백업 복원 함수
    const startRestore = async () => {
        try {
            // 복원 전 사용자 확인
            const confirmed = await showRestoreConfirmation();
            if (!confirmed) return;

            setIsBackupInProgress(true);
            setBackupProgress(0);

            // 백업 파일 선택
            const backupFile = await selectBackupFile();
            if (!backupFile) {
                setIsBackupInProgress(false);
                return;
            }

            // 백업 파일 무결성 검증
            const isValid = await validateBackupFile(backupFile);
            if (!isValid) {
                throw new Error('백업 파일이 손상되었습니다.');
            }

            // 데이터 복원
            await restoreFromBackup(backupFile);

            setIsBackupInProgress(false);
            setBackupProgress(1);

            // 복원 완료 알림
            showRestoreCompleteNotification();
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        } catch (error) {
            console.error('Restore failed:', error);
            setIsBackupInProgress(false);
            Alert.alert('복원 실패', '복원 중 오류가 발생했습니다.');
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };
    // UI 렌더링 메서드들
    const renderBackupOptions = () => (
        <View style={styles.optionsSection}>
            <Text style={styles.sectionTitle}>백업 옵션</Text>

            {/* 백업 유형 선택 */}
            <View style={styles.optionItem}>
                <Text style={styles.optionLabel}>백업 유형</Text>
                <Switch
                    value={backupType === 'full'}
                    onValueChange={(value) => setBackupType(value ? 'full' : 'selective')}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={backupType === 'full' ? '#2196F3' : '#f4f3f4'}
                />
                <Text style={styles.optionValue}>
                    {backupType === 'full' ? '전체 백업' : '선택적 백업'}
                </Text>
            </View>

            {/* 저장소 선택 */}
            <View style={styles.optionItem}>
                <Text style={styles.optionLabel}>저장소 위치</Text>
                <View style={styles.radioGroup}>
                    <TouchableOpacity
                        style={[
                            styles.radioButton,
                            storageType === 'local' && styles.radioButtonActive
                        ]}
                        onPress={() => setStorageType('local')}
                    >
                        <MaterialIcons
                            name={storageType === 'local' ? 'radio-button-checked' : 'radio-button-unchecked'}
                            size={24}
                            color={storageType === 'local' ? '#2196F3' : '#757575'}
                        />
                        <Text style={styles.radioLabel}>로컬 저장소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.radioButton,
                            storageType === 'cloud' && styles.radioButtonActive
                        ]}
                        onPress={() => setStorageType('cloud')}
                    >
                        <MaterialIcons
                            name={storageType === 'cloud' ? 'radio-button-checked' : 'radio-button-unchecked'}
                            size={24}
                            color={storageType === 'cloud' ? '#2196F3' : '#757575'}
                        />
                        <Text style={styles.radioLabel}>클라우드 저장소</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* 백업 주기 설정 */}
            <View style={styles.optionItem}>
                <Text style={styles.optionLabel}>백업 주기</Text>
                <DropDownPicker
                    items={[
                        { label: '매일', value: 'daily' },
                        { label: '매주', value: 'weekly' },
                        { label: '매월', value: 'monthly' },
                        { label: '사용자 지정', value: 'custom' }
                    ]}
                    defaultValue={backupInterval}
                    containerStyle={styles.dropdownContainer}
                    style={styles.dropdown}
                    itemStyle={styles.dropdownItem}
                    dropDownStyle={styles.dropdownList}
                    onChangeItem={item => setBackupInterval(item.value)}
                />
            </View>
        </View>
    );

    const renderProgressBar = () => (
        <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>
                {isBackupInProgress ? '백업 진행 중...' : '마지막 백업: ' + formatDate(lastBackupDate)}
            </Text>
            <Progress.Bar
                progress={backupProgress}
                width={null}
                height={10}
                color="#2196F3"
                unfilledColor="#E0E0E0"
                borderWidth={0}
                borderRadius={5}
                animated={true}
                useNativeDriver={true}
            />
            {isBackupInProgress && (
                <Text style={styles.progressText}>
                    {Math.round(backupProgress * 100)}% 완료
                </Text>
            )}
        </View>
    );

    const renderActionButtons = () => (
        <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
                style={[styles.actionButton, styles.backupButton]}
                onPress={startBackup}
                disabled={isBackupInProgress}
            >
                <MaterialIcons name="backup" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>백업 시작</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.actionButton, styles.restoreButton]}
                onPress={startRestore}
                disabled={isBackupInProgress}
            >
                <MaterialIcons name="restore" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>복원하기</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* 헤더 */}
            <View style={styles.header}>
                <Text style={styles.title}>채팅 백업 및 복원</Text>
                <TouchableOpacity
                    style={styles.helpButton}
                    onPress={() => Alert.alert('도움말', '백업 및 복원 기능에 대한 설명')}
                >
                    <MaterialIcons name="help-outline" size={24} color="#757575" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* 백업 옵션 */}
                {renderBackupOptions()}

                {/* 진행 상태 표시 */}
                {renderProgressBar()}
            </ScrollView>

            {/* 하단 작업 버튼 */}
            {renderActionButtons()}

            {/* 로딩 인디케이터 */}
            {isBackupInProgress && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#2196F3" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
        paddingHorizontal: 16,
        paddingBottom: 8,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    title: {
        fontSize: 24,
        fontFamily: 'SFProDisplay-Bold',
        color: '#333333',
        marginBottom: 8,
    },
    helpButton: {
        position: 'absolute',
        right: 16,
        top: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    optionsSection: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'SFProText-Semibold',
        color: '#333333',
        marginBottom: 16,
    },
    optionItem: {
        marginBottom: 24,
    },
    optionLabel: {
        fontSize: 16,
        fontFamily: 'SFProText-Regular',
        color: '#333333',
        marginBottom: 8,
    },
    radioGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 24,
        paddingVertical: 8,
    },
    radioButtonActive: {
        backgroundColor: '#E3F2FD',
        borderRadius: 20,
    },
    radioLabel: {
        fontSize: 16,
        fontFamily: 'SFProText-Regular',
        color: '#333333',
        marginLeft: 8,
    },
    dropdownContainer: {
        height: 40,
    },
    dropdown: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
    },
    dropdownItem: {
        justifyContent: 'flex-start',
    },
    dropdownList: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
    },
    progressContainer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 14,
        fontFamily: 'SFProText-Regular',
        color: '#757575',
        marginBottom: 8,
    },
    progressText: {
        fontSize: 14,
        fontFamily: 'SFProText-Regular',
        color: '#333333',
        marginTop: 8,
        textAlign: 'center',
    },
    actionButtonsContainer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    actionButton: {
        height: 50,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    backupButton: {
        backgroundColor: '#2196F3',
    },
    restoreButton: {
        backgroundColor: '#F5A623',
    },
    buttonText: {
        fontSize: 16,
        fontFamily: 'SFProDisplay-Bold',
        color: '#FFFFFF',
        marginLeft: 8,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        margin: 0,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        padding: 16,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    modalOptionText: {
        fontSize: 16,
        fontFamily: 'SFProText-Regular',
        color: '#333333',
        marginLeft: 16,
    },
    confirmDialog: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        maxWidth: 280,
        alignSelf: 'center',
    },
    confirmTitle: {
        fontSize: 18,
        fontFamily: 'SFProText-Semibold',
        color: '#333333',
        marginBottom: 16,
        textAlign: 'center',
    },
    confirmMessage: {
        fontSize: 16,
        fontFamily: 'SFProText-Regular',
        color: '#757575',
        marginBottom: 24,
        textAlign: 'center',
    },
    confirmButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    confirmButton: {
        flex: 1,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    cancelButton: {
        backgroundColor: '#F5F5F5',
    },
    confirmButtonText: {
        fontSize: 16,
        fontFamily: 'SFProText-Medium',
        color: '#FFFFFF',
    },
    cancelButtonText: {
        color: '#333333',
    }
});

export default ChatBackupScreen;