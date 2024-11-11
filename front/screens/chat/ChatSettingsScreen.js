// ChatSettingsScreen.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Switch,
    Platform,
    StatusBar,
    Dimensions,
    Animated,
    Alert, ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Modal from 'react-native-modal';
import * as Haptics from 'expo-haptics';
import i18n from '../i18n';
import { API_URL } from '../../config/api';
import { updateSettings } from '../redux/slices/settingsSlice';
import { encryptData, decryptData } from '../utils/encryption';
import { logError } from '../utils/errorLogger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ChatSettingsScreen = () => {
    // 상태 관리
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredSettings, setFilteredSettings] = useState([]);
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipContent, setTooltipContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState({
        general: {
            fontSize: 'medium',
            background: 'default',
            language: 'ko'
        },
        notifications: {
            push: true,
            sound: true,
            doNotDisturb: {
                enabled: false,
                startTime: '22:00',
                endTime: '07:00'
            }
        },
        privacy: {
            readReceipt: true,
            lastSeen: true,
            profilePhoto: 'all'
        },
        data: {
            autoDownload: 'wifi',
            dataSaver: false
        },
        theme: {
            mode: 'light',
            customColor: null
        }
    });

    // Redux
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);
    const globalSettings = useSelector(state => state.settings);

    // Refs
    const searchInputRef = useRef(null);
    const scrollViewRef = useRef(null);
    const tooltipTimeoutRef = useRef(null);

    // Navigation
    const navigation = useNavigation();

    // 초기화
    useEffect(() => {
        initializeScreen();
        return () => cleanupScreen();
    }, []);

    const initializeScreen = async () => {
        try {
            await loadSettings();
            setupSearchFunctionality();
        } catch (error) {
            console.error('Screen initialization failed:', error);
            Alert.alert('초기화 오류', '설정을 불러오는데 실패했습니다.');
        }
    };

    const cleanupScreen = () => {
        if (tooltipTimeoutRef.current) {
            clearTimeout(tooltipTimeoutRef.current);
        }
    };

    // 설정 로드
    const loadSettings = async () => {
        try {
            const encryptedSettings = await AsyncStorage.getItem('chatSettings');
            if (encryptedSettings) {
                const decryptedSettings = await decryptData(encryptedSettings);
                setSettings(JSON.parse(decryptedSettings));
            }
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to load settings:', error);
            logError('loadSettings', error);
            setIsLoading(false);
        }
    };

    // 설정 저장
    const saveSettings = async (newSettings) => {
        try {
            const encryptedSettings = await encryptData(JSON.stringify(newSettings));
            await AsyncStorage.setItem('chatSettings', encryptedSettings);
            dispatch(updateSettings(newSettings));

            // 서버 동기화
            await syncSettingsWithServer(newSettings);

            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Failed to save settings:', error);
            logError('saveSettings', error);
            Alert.alert('저장 실패', '설정 저장에 실패했습니다.');
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    // 설정 변경 관련 함수들
    const handleSettingChange = async (category, setting, value) => {
        try {
            const newSettings = {
                ...settings,
                [category]: {
                    ...settings[category],
                    [setting]: value
                }
            };

            // 서버에 설정 업데이트
            const token = await AsyncStorage.getItem('userToken');
            await axios.put(
                `${API_URL}/api/settings`,
                { settings: newSettings },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSettings(newSettings);
            dispatch(updateSettings(newSettings));

            // 햅틱 피드백
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            // 민감한 설정 변경 시 재인증 요구
            if (isSensitiveSetting(category, setting)) {
                const isAuthenticated = await authenticateUser();
                if (!isAuthenticated) {
                    revertSetting(category, setting);
                    return;
                }
            }

        } catch (error) {
            console.error('Failed to update setting:', error);
            logError('handleSettingChange', error);
            Alert.alert('설정 변경 실패', '설정을 변경하는데 실패했습니다.');
            revertSetting(category, setting);
        }
    };

    // 검색 관련 함수들
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);

        // 검색어가 비어있으면 전체 설정 표시
        if (!query.trim()) {
            setFilteredSettings(Object.entries(settings));
            return;
        }

        // Fuse.js를 사용한 퍼지 검색
        const fuse = new Fuse(Object.entries(settings), {
            keys: ['0', '1.name', '1.description'],
            threshold: 0.4,
            shouldSort: true
        });

        const results = fuse.search(query);
        setFilteredSettings(results.map(result => result.item));
    }, [settings]);

    const showSettingTooltip = (setting) => {
        setTooltipContent(setting.description);
        setShowTooltip(true);

        // 3초 후 툴팁 자동 숨김
        tooltipTimeoutRef.current = setTimeout(() => {
            setShowTooltip(false);
        }, 3000);
    };

    // 렌더링 메서드들
    const renderSettingItem = useCallback(({ item: [category, settingGroup] }) => (
        <View style={styles.settingSection}>
            <Text style={styles.sectionTitle}>
                {getCategoryTitle(category)}
            </Text>
            {Object.entries(settingGroup).map(([key, setting]) => (
                <TouchableOpacity
                    key={key}
                    style={styles.settingItem}
                    onPress={() => handleSettingPress(category, key, setting)}
                    onLongPress={() => showSettingTooltip(setting)}
                    delayLongPress={500}
                >
                    <View style={styles.settingInfo}>
                        <MaterialIcons
                            name={setting.icon}
                            size={24}
                            color="#333333"
                        />
                        <View style={styles.settingTexts}>
                            <Text style={styles.settingName}>{setting.name}</Text>
                            {setting.description && (
                                <Text style={styles.settingDescription} numberOfLines={1}>
                                    {setting.description}
                                </Text>
                            )}
                        </View>
                    </View>

                    {renderSettingControl(category, key, setting)}
                </TouchableOpacity>
            ))}
        </View>
    ), [settings]);

    const renderSettingControl = (category, key, setting) => {
        switch (setting.type) {
            case 'toggle':
                return (
                    <Switch
                        value={settings[category][key]}
                        onValueChange={(value) => handleSettingChange(category, key, value)}
                        trackColor={{ false: '#767577', true: '#81b0ff' }}
                        thumbColor={settings[category][key] ? '#2196F3' : '#f4f3f4'}
                    />
                );

            case 'select':
                return (
                    <TouchableOpacity
                        style={styles.selectButton}
                        onPress={() => showSettingOptions(category, key, setting)}
                    >
                        <Text style={styles.selectButtonText}>
                            {getSettingValueLabel(category, key)}
                        </Text>
                        <MaterialIcons name="chevron-right" size={24} color="#757575" />
                    </TouchableOpacity>
                );

            default:
                return null;
        }
    };

    const renderTooltip = () => (
        <Modal
            isVisible={showTooltip}
            backdropOpacity={0}
            animationIn="fadeIn"
            animationOut="fadeOut"
            onBackdropPress={() => setShowTooltip(false)}
        >
            <View style={styles.tooltip}>
                <Text style={styles.tooltipText}>{tooltipContent}</Text>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* 헤더 */}
            <View style={styles.header}>
                <Text style={styles.title}>채팅 설정</Text>
                <TouchableOpacity
                    style={styles.helpButton}
                    onPress={() => navigation.navigate('SettingsHelp')}
                >
                    <MaterialIcons name="help-outline" size={24} color="#757575" />
                </TouchableOpacity>
            </View>

            {/* 검색바 */}
            <View style={styles.searchContainer}>
                <MaterialIcons
                    name="search"
                    size={24}
                    color="#757575"
                    style={styles.searchIcon}
                />
                <TextInput
                    ref={searchInputRef}
                    style={styles.searchInput}
                    placeholder="설정 검색"
                    placeholderTextColor="#757575"
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
            </View>

            {/* 설정 목록 */}
            <ScrollView style={styles.content}>
                {filteredSettings.map(renderSettingItem)}
            </ScrollView>

            {/* 버전 정보 및 도움말 */}
            <View style={styles.footer}>
                <Text style={styles.version}>버전 1.0.0</Text>
                <TouchableOpacity
                    style={styles.helpLink}
                    onPress={() => navigation.navigate('Help')}
                >
                    <Text style={styles.helpLinkText}>도움말</Text>
                </TouchableOpacity>
            </View>

            {renderTooltip()}

            {/* 로딩 인디케이터 */}
            {isLoading && (
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
        backgroundColor: '#F8F8F8',
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        height: 50,
        paddingHorizontal: 16,
        marginBottom: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'SFProText-Regular',
        color: '#333333',
        marginLeft: 8,
    },
    searchIcon: {
        width: 24,
        height: 24,
    },
    settingSection: {
        backgroundColor: '#FFFFFF',
        marginTop: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'SFProText-Semibold',
        color: '#333333',
        padding: 16,
        backgroundColor: '#F8F8F8',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    settingInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingIcon: {
        width: 24,
        height: 24,
        marginRight: 16,
    },
    settingTexts: {
        flex: 1,
    },
    settingName: {
        fontSize: 16,
        fontFamily: 'SFProText-Regular',
        color: '#333333',
    },
    settingDescription: {
        fontSize: 14,
        fontFamily: 'SFProText-Regular',
        color: '#757575',
        marginTop: 2,
    },
    switchContainer: {
        marginLeft: 8,
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectButtonText: {
        fontSize: 16,
        fontFamily: 'SFProText-Regular',
        color: '#757575',
        marginRight: 8,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        backgroundColor: '#FFFFFF',
    },
    version: {
        fontSize: 14,
        fontFamily: 'SFProText-Regular',
        color: '#757575',
        textAlign: 'center',
    },
    helpLink: {
        marginTop: 8,
        alignItems: 'center',
    },
    helpLinkText: {
        fontSize: 14,
        fontFamily: 'SFProText-Regular',
        color: '#4A90E2',
    },
    tooltip: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderRadius: 8,
        maxWidth: 250,
    },
    tooltipText: {
        fontSize: 14,
        fontFamily: 'SFProText-Regular',
        color: '#FFFFFF',
        textAlign: 'center',
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
        maxHeight: '80%',
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
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
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
});

export default ChatSettingsScreen;