// NotificationSettingsScreen.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    Switch,
    ScrollView,
    TouchableOpacity,
    Platform,
    StatusBar,
    Animated,
    Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import DropDownPicker from 'react-native-dropdown-picker';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import { updateNotificationSettings } from '../redux/slices/settingsSlice';
import { encryptData, decryptData } from '../utils/encryption';

const NotificationSettingsScreen = () => {
    // 상태 관리
    const [settings, setSettings] = useState({
        push: {
            enabled: true,
            priority: 'high',
            timeRange: {
                start: '08:00',
                end: '22:00'
            }
        },
        email: {
            enabled: true,
            frequency: 'daily'
        },
        study: {
            goalAchievement: true,
            quizReminder: true,
            studyStreak: true,
            groupActivity: true
        },
        methods: {
            inApp: true,
            push: true,
            email: true
        }
    });

    const [isLoading, setIsLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

    // Redux
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);

    // Refs
    const scrollViewRef = useRef(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Navigation
    const navigation = useNavigation();

    // 초기화
    useEffect(() => {
        loadSettings();
        startEntryAnimation();

        return () => {
            if (hasUnsavedChanges) {
                showUnsavedChangesAlert();
            }
        };
    }, []);

    const loadSettings = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(
                `${API_URL}/api/settings/notifications`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const decryptedSettings = await decryptData(response.data.settings);
            setSettings(JSON.parse(decryptedSettings));
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to load notification settings:', error);
            Alert.alert('오류', '설정을 불러오는데 실패했습니다.');
            setIsLoading(false);
        }
    };

    const startEntryAnimation = () => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
        }).start();
    };

    // 설정 업데이트 함수들
    const handleSettingUpdate = async (settingType, value) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const encryptedSettings = await encryptData(JSON.stringify({
                ...settings,
                [settingType]: value
            }));

            await axios.put(
                `${API_URL}/api/settings/notifications/${settingType}`,
                { value: encryptedSettings },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSettings(prev => ({
                ...prev,
                [settingType]: value
            }));

            dispatch(updateNotificationSettings({ [settingType]: value }));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Failed to update setting:', error);
            Alert.alert('오류', '설정 업데이트에 실패했습니다.');
        }
    };

    const handleTimeRangeUpdate = async (type, time) => {
        try {
            const newTimeRange = {
                ...settings.push.timeRange,
                [type]: time
            };

            await handleSettingUpdate('push', {
                ...settings.push,
                timeRange: newTimeRange
            });
        } catch (error) {
            console.error('Failed to update time range:', error);
            Alert.alert('오류', '시간 설정 업데이트에 실패했습니다.');
        }
    };

    const handlePriorityUpdate = async (priority) => {
        try {
            await handleSettingUpdate('push', {
                ...settings.push,
                priority
            });
            setShowPriorityDropdown(false);
        } catch (error) {
            console.error('Failed to update priority:', error);
            Alert.alert('오류', '우선순위 설정 업데이트에 실패했습니다.');
        }
    };

    // 렌더링 메서드들
    const renderPushNotificationSection = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>푸시 알림</Text>
            <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                    <MaterialIcons name="notifications" size={24} color="#757575" />
                    <Text style={styles.settingLabel}>푸시 알림 받기</Text>
                </View>
                <Switch
                    value={settings.push.enabled}
                    onValueChange={(value) => handleSettingUpdate('push', {
                        ...settings.push,
                        enabled: value
                    })}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={settings.push.enabled ? '#2196F3' : '#f4f3f4'}
                />
            </View>

            <TouchableOpacity
                style={styles.settingItem}
                onPress={() => setShowPriorityDropdown(true)}
            >
                <View style={styles.settingLeft}>
                    <MaterialIcons name="priority-high" size={24} color="#757575" />
                    <Text style={styles.settingLabel}>알림 우선순위</Text>
                </View>
                <View style={styles.settingRight}>
                    <Text style={styles.settingValue}>
                        {settings.push.priority === 'high' ? '높음' : '보통'}
                    </Text>
                    <MaterialIcons name="chevron-right" size={24} color="#757575" />
                </View>
            </TouchableOpacity>

            <View style={styles.timeRangeContainer}>
                <Text style={styles.timeRangeLabel}>알림 수신 시간</Text>
                <View style={styles.timeInputs}>
                    <TouchableOpacity
                        style={styles.timeInput}
                        onPress={() => showTimePicker('start')}
                    >
                        <Text style={styles.timeText}>{settings.push.timeRange.start}</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeRangeSeparator}>~</Text>
                    <TouchableOpacity
                        style={styles.timeInput}
                        onPress={() => showTimePicker('end')}
                    >
                        <Text style={styles.timeText}>{settings.push.timeRange.end}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderEmailNotificationSection = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>이메일 알림</Text>
            <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                    <MaterialIcons name="email" size={24} color="#757575" />
                    <Text style={styles.settingLabel}>이메일 알림 받기</Text>
                </View>
                <Switch
                    value={settings.email.enabled}
                    onValueChange={(value) => handleSettingUpdate('email', {
                        ...settings.email,
                        enabled: value
                    })}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={settings.email.enabled ? '#2196F3' : '#f4f3f4'}
                />
            </View>

            <TouchableOpacity
                style={styles.settingItem}
                onPress={() => setShowFrequencyDropdown(true)}
            >
                <View style={styles.settingLeft}>
                    <MaterialIcons name="update" size={24} color="#757575" />
                    <Text style={styles.settingLabel}>알림 빈도</Text>
                </View>
                <View style={styles.settingRight}>
                    <Text style={styles.settingValue}>
                        {getFrequencyLabel(settings.email.frequency)}
                    </Text>
                    <MaterialIcons name="chevron-right" size={24} color="#757575" />
                </View>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* 헤더 */}
            <View style={styles.header}>
                <Text style={styles.title}>알림 설정</Text>
            </View>

            {/* 메인 콘텐츠 */}
            <ScrollView style={styles.content}>
                {renderPushNotificationSection()}
                {renderEmailNotificationSection()}

                {/* 학습 관련 알림 설정 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>학습 알림</Text>
                    {Object.entries(settings.study).map(([key, value]) => (
                        <View key={key} style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <MaterialIcons
                                    name={getStudyNotificationIcon(key)}
                                    size={24}
                                    color="#757575"
                                />
                                <Text style={styles.settingLabel}>
                                    {getStudyNotificationLabel(key)}
                                </Text>
                            </View>
                            <Switch
                                value={value}
                                onValueChange={(newValue) => handleSettingUpdate('study', {
                                    ...settings.study,
                                    [key]: newValue
                                })}
                                trackColor={{ false: '#767577', true: '#81b0ff' }}
                                thumbColor={value ? '#2196F3' : '#f4f3f4'}
                            />
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* 드롭다운 모달 */}
            <Modal
                isVisible={showPriorityDropdown}
                onBackdropPress={() => setShowPriorityDropdown(false)}
                style={styles.modal}
            >
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>알림 우선순위</Text>
                    {PRIORITY_OPTIONS.map(option => (
                        <TouchableOpacity
                            key={option.value}
                            style={styles.modalOption}
                            onPress={() => handlePriorityUpdate(option.value)}
                        >
                            <Text style={[
                                styles.modalOptionText,
                                settings.push.priority === option.value && styles.modalOptionActive
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Modal>

            {/* 로딩 인디케이터 */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#2196F3" />
                </View>
            )}
        </View>
    );
};
// 렌더링 메서드들
const renderNotificationSection = () => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>알림 설정</Text>

        {/* 푸시 알림 설정 */}
        <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
                <MaterialIcons name="notifications" size={24} color="#757575" />
                <Text style={styles.settingLabel}>푸시 알림</Text>
            </View>
            <Switch
                value={settings.push.enabled}
                onValueChange={(value) => handleSettingUpdate('push', {
                    ...settings.push,
                    enabled: value
                })}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={settings.push.enabled ? '#2196F3' : '#f4f3f4'}
            />
        </View>

        {/* 알림 우선순위 설정 */}
        <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowPriorityDropdown(true)}
        >
            <View style={styles.settingLeft}>
                <MaterialIcons name="priority-high" size={24} color="#757575" />
                <Text style={styles.settingLabel}>알림 우선순위</Text>
            </View>
            <View style={styles.settingRight}>
                <Text style={styles.settingValue}>
                    {getPriorityLabel(settings.push.priority)}
                </Text>
                <MaterialIcons name="chevron-right" size={24} color="#757575" />
            </View>
        </TouchableOpacity>

        {/* 알림 시간대 설정 */}
        <View style={styles.timeRangeContainer}>
            <Text style={styles.timeRangeLabel}>알림 수신 시간</Text>
            <View style={styles.timeInputs}>
                <TouchableOpacity
                    style={styles.timeInput}
                    onPress={() => showTimePicker('start')}
                >
                    <Text style={styles.timeText}>{settings.push.timeRange.start}</Text>
                </TouchableOpacity>
                <Text style={styles.timeRangeSeparator}>~</Text>
                <TouchableOpacity
                    style={styles.timeInput}
                    onPress={() => showTimePicker('end')}
                >
                    <Text style={styles.timeText}>{settings.push.timeRange.end}</Text>
                </TouchableOpacity>
            </View>
        </View>
    </View>
);

const renderStudyNotifications = () => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>학습 알림</Text>
        {Object.entries(settings.study).map(([key, value]) => (
            <View key={key} style={styles.settingItem}>
                <View style={styles.settingLeft}>
                    <MaterialIcons
                        name={getStudyNotificationIcon(key)}
                        size={24}
                        color="#757575"
                    />
                    <Text style={styles.settingLabel}>
                        {getStudyNotificationLabel(key)}
                    </Text>
                </View>
                <Switch
                    value={value}
                    onValueChange={(newValue) => handleSettingUpdate('study', {
                        ...settings.study,
                        [key]: newValue
                    })}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={value ? '#2196F3' : '#f4f3f4'}
                />
            </View>
        ))}
    </View>
);

return (
    <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* 헤더 */}
        <View style={styles.header}>
            <Text style={styles.title}>알림 설정</Text>
        </View>

        {/* 메인 콘텐츠 */}
        <ScrollView style={styles.content}>
            {renderNotificationSection()}
            {renderStudyNotifications()}
        </ScrollView>

        {/* 우선순위 설정 모달 */}
        <Modal
            isVisible={showPriorityDropdown}
            onBackdropPress={() => setShowPriorityDropdown(false)}
            style={styles.modal}
        >
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>알림 우선순위</Text>
                {PRIORITY_OPTIONS.map(option => (
                    <TouchableOpacity
                        key={option.value}
                        style={styles.modalOption}
                        onPress={() => handlePriorityUpdate(option.value)}
                    >
                        <Text style={[
                            styles.modalOptionText,
                            settings.push.priority === option.value && styles.modalOptionActive
                        ]}>
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </Modal>

        {/* 로딩 인디케이터 */}
        {isLoading && (
            <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#2196F3" />
            </View>
        )}
    </View>
)
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
    },
    content: {
        flex: 1,
    },
    section: {
        backgroundColor: '#FFFFFF',
        marginTop: 16,
        paddingVertical: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'SFProText-Semibold',
        color: '#333333',
        marginLeft: 16,
        marginVertical: 8,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingLabel: {
        fontSize: 16,
        fontFamily: 'SFProText-Regular',
        color: '#333333',
        marginLeft: 12,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingValue: {
        fontSize: 16,
        fontFamily: 'SFProText-Regular',
        color: '#757575',
        marginRight: 8,
    },
    timeRangeContainer: {
        padding: 16,
    },
    timeRangeLabel: {
        fontSize: 16,
        fontFamily: 'SFProText-Regular',
        color: '#333333',
        marginBottom: 8,
    },
    timeInputs: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeInput: {
        backgroundColor: '#F5F5F5',
        padding: 8,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    timeText: {
        fontSize: 16,
        fontFamily: 'SFProText-Regular',
        color: '#333333',
    },
    timeRangeSeparator: {
        marginHorizontal: 16,
        fontSize: 16,
        color: '#757575',
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
    modalTitle: {
        fontSize: 20,
        fontFamily: 'SFProDisplay-Bold',
        color: '#333333',
        marginBottom: 16,
    },
    modalOption: {
        paddingVertical: 12,
    },
    modalOptionText: {
        fontSize: 16,
        fontFamily: 'SFProText-Regular',
        color: '#333333',
    },
    modalOptionActive: {
        color: '#2196F3',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default NotificationSettingsScreen;