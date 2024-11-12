// screens/mypage/NotificationSettingsScreen.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    Switch,
    TouchableOpacity,
    Alert,
    StyleSheet,
    Platform,
    StatusBar,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import { API_URL } from '../../config/api';
import Slider from '@react-native-community/slider';
import CheckBox from '@react-native-community/checkbox';

const NotificationSettingsScreen = ({ navigation }) => {
    // 상태 관리
    const [isLoading, setIsLoading] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [priority, setPriority] = useState('normal');
    const [timeRange, setTimeRange] = useState({ start: 8, end: 22 });
    const [notificationMethods, setNotificationMethods] = useState({
        popup: true,
        push: true,
        email: false
    });
    const [learningNotifications, setLearningNotifications] = useState({
        goals: true,
        quiz: true,
        reminders: true,
        updates: true
    });

    // 애니메이션 값
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    // 설정 변경 추적
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const originalSettings = useRef(null);

    useEffect(() => {
        const initializeSettings = async () => {
            try {
                setIsLoading(true);
                await checkNotificationPermissions();
                await loadSettings();
                startEntryAnimation();
            } catch (error) {
                console.error('Settings initialization failed:', error);
                Alert.alert('오류', '설정을 불러오는데 실패했습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        initializeSettings();

        return () => {
            // Cleanup
            if (hasUnsavedChanges) {
                saveSettings();
            }
        };
    }, []);

    // 권한 체크
    const checkNotificationPermissions = async () => {
        try {
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== 'granted') {
                const { status: newStatus } = await Notifications.requestPermissionsAsync();
                setPushEnabled(newStatus === 'granted');
            } else {
                setPushEnabled(true);
            }
        } catch (error) {
            console.error('Notification permission check failed:', error);
            setPushEnabled(false);
        }
    };

    // 진입 애니메이션
    const startEntryAnimation = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    };

    // 설정 로드
    const loadSettings = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(
                `${API_URL}/settings/notifications`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const settings = response.data;

            setPushEnabled(settings.pushEnabled);
            setEmailEnabled(settings.emailEnabled);
            setPriority(settings.priority);
            setTimeRange(settings.timeRange);
            setNotificationMethods(settings.notificationMethods);
            setLearningNotifications(settings.learningNotifications);

            // 원본 설정 저장
            originalSettings.current = settings;
        } catch (error) {
            console.error('Settings load failed:', error);
            // 로컬 데이터 로드
            const localSettings = await AsyncStorage.getItem('notificationSettings');
            if (localSettings) {
                const settings = JSON.parse(localSettings);
                setPushEnabled(settings.pushEnabled);
                setEmailEnabled(settings.emailEnabled);
                setPriority(settings.priority);
                setTimeRange(settings.timeRange);
                setNotificationMethods(settings.notificationMethods);
                setLearningNotifications(settings.learningNotifications);
            }
        }
    };

    // 설정 저장
    const saveSettings = async () => {
        try {
            setIsLoading(true);
            const settings = {
                pushEnabled,
                emailEnabled,
                priority,
                timeRange,
                notificationMethods,
                learningNotifications,
            };

            const token = await AsyncStorage.getItem('userToken');
            await axios.put(
                `${API_URL}/settings/notifications`,
                settings,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
            setHasUnsavedChanges(false);
            Alert.alert('성공', '알림 설정이 저장되었습니다.');
        } catch (error) {
            console.error('Settings save failed:', error);
            Alert.alert('오류', '설정 저장에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 설정 변경 핸들러
    const handlePushToggle = useCallback(async (value) => {
        if (value && !pushEnabled) {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    '알림 권한 필요',
                    '푸시 알림을 받으려면 알림 권한이 필요합니다.',
                    [
                        { text: '설정으로 이동', onPress: () => Linking.openSettings() },
                        { text: '취소', style: 'cancel' }
                    ]
                );
                return;
            }
        }
        setPushEnabled(value);
        setHasUnsavedChanges(true);
    }, [pushEnabled]);

    const handleEmailToggle = useCallback((value) => {
        setEmailEnabled(value);
        setHasUnsavedChanges(true);
    }, []);

    const handlePriorityChange = useCallback((value) => {
        setPriority(value);
        setHasUnsavedChanges(true);
    }, []);

    const handleTimeRangeChange = useCallback((type, value) => {
        setTimeRange(prev => ({
            ...prev,
            [type]: value
        }));
        setHasUnsavedChanges(true);
    }, []);

    const handleMethodToggle = useCallback((method, value) => {
        setNotificationMethods(prev => ({
            ...prev,
            [method]: value
        }));
        setHasUnsavedChanges(true);
    }, []);

    const handleLearningNotificationToggle = useCallback((type, value) => {
        setLearningNotifications(prev => ({
            ...prev,
            [type]: value
        }));
        setHasUnsavedChanges(true);
    }, []);

    // 설정 초기화
    const resetSettings = useCallback(async () => {
        Alert.alert(
            '설정 초기화',
            '모든 알림 설정을 기본값으로 초기화하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '확인',
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            const token = await AsyncStorage.getItem('userToken');
                            await axios.post(
                                `${API_URL}/settings/notifications/reset`,
                                {},
                                {
                                    headers: { Authorization: `Bearer ${token}` }
                                }
                            );
                            await loadSettings();
                            Alert.alert('성공', '설정이 초기화되었습니다.');
                        } catch (error) {
                            console.error('Settings reset failed:', error);
                            Alert.alert('오류', '설정 초기화에 실패했습니다.');
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    }, []);

    // 섹션 렌더링 컴포넌트
    const renderSection = useCallback(({ title, backgroundColor, children }) => (
        <Animated.View
            style={[
                styles.section,
                { backgroundColor },
                {
                    opacity: fadeAnim,
                    transform: [{
                        translateY: slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0]
                        })
                    }]
                }
            ]}
        >
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </Animated.View>
    ), [fadeAnim, slideAnim]);

    // 메인 렌더링
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

            {/* 상단 바 */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>알림 설정</Text>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveSettings}
                    disabled={isLoading || !hasUnsavedChanges}
                >
                    <MaterialIcons
                        name="save"
                        size={24}
                        color={hasUnsavedChanges ? colors.primary : colors.textSecondary}
                    />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView style={styles.scrollView}>
                    {/* 푸시 및 이메일 알림 설정 */}
                    {renderSection({
                        title: "알림 수신 설정",
                        backgroundColor: "#F8F8F8",
                        children: (
                            <>
                                <View style={styles.settingItem}>
                                    <Text style={styles.settingLabel}>푸시 알림</Text>
                                    <Switch
                                        value={pushEnabled}
                                        onValueChange={handlePushToggle}
                                        trackColor={{ false: '#767577', true: colors.primary }}
                                    />
                                </View>
                                <View style={styles.settingItem}>
                                    <Text style={styles.settingLabel}>이메일 알림</Text>
                                    <Switch
                                        value={emailEnabled}
                                        onValueChange={handleEmailToggle}
                                        trackColor={{ false: '#767577', true: colors.primary }}
                                    />
                                </View>
                            </>
                        )
                    })}

                    {/* 알림 우선순위 설정 */}
                    {renderSection({
                        title: "알림 우선순위",
                        backgroundColor: "#E8F5E9",
                        children: (
                            <View style={styles.priorityContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.priorityButton,
                                        priority === 'high' && styles.priorityButtonActive
                                    ]}
                                    onPress={() => handlePriorityChange('high')}
                                >
                                    <Text style={styles.priorityButtonText}>높음</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.priorityButton,
                                        priority === 'normal' && styles.priorityButtonActive
                                    ]}
                                    onPress={() => handlePriorityChange('normal')}
                                >
                                    <Text style={styles.priorityButtonText}>보통</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.priorityButton,
                                        priority === 'low' && styles.priorityButtonActive
                                    ]}
                                    onPress={() => handlePriorityChange('low')}
                                >
                                    <Text style={styles.priorityButtonText}>낮음</Text>
                                </TouchableOpacity>
                            </View>
                        )
                    })}

                    {/* 알림 수신 시간대 설정 */}
                    {renderSection({
                        title: "알림 수신 시간",
                        backgroundColor: "#FFF3E0",
                        children: (
                            <View style={styles.timeRangeContainer}>
                                <Text style={styles.timeRangeText}>
                                    {`${timeRange.start}:00 ~ ${timeRange.end}:00`}
                                </Text>
                                <Slider
                                    style={styles.timeSlider}
                                    minimumValue={0}
                                    maximumValue={24}
                                    step={1}
                                    value={timeRange.start}
                                    onValueChange={(value) => handleTimeRangeChange('start', value)}
                                />
                                <Slider
                                    style={styles.timeSlider}
                                    minimumValue={0}
                                    maximumValue={24}
                                    step={1}
                                    value={timeRange.end}
                                    onValueChange={(value) => handleTimeRangeChange('end', value)}
                                />
                            </View>
                        )
                    })}

                    {/* 알림 수신 방법 */}
                    {renderSection({
                        title: "알림 수신 방법",
                        backgroundColor: "#E1F5FE",
                        children: (
                            <>
                                <View style={styles.settingItem}>
                                    <Text style={styles.settingLabel}>알림창</Text>
                                    <CheckBox
                                        value={notificationMethods.popup}
                                        onValueChange={(value) => handleMethodToggle('popup', value)}
                                    />
                                </View>
                                <View style={styles.settingItem}>
                                    <Text style={styles.settingLabel}>푸시 알림</Text>
                                    <CheckBox
                                        value={notificationMethods.push}
                                        onValueChange={(value) => handleMethodToggle('push', value)}
                                    />
                                </View>
                                <View style={styles.settingItem}>
                                    <Text style={styles.settingLabel}>이메일</Text>
                                    <CheckBox
                                        value={notificationMethods.email}
                                        onValueChange={(value) => handleMethodToggle('email', value)}
                                    />
                                </View>
                            </>
                        )
                    })}

                    {/* 학습 관련 알림 */}
                    {renderSection({
                        title: "학습 알림 설정",
                        backgroundColor: "#F0F4C3",
                        children: (
                            <>
                                <View style={styles.settingItem}>
                                    <Text style={styles.settingLabel}>목표 달성</Text>
                                    <Switch
                                        value={learningNotifications.goals}
                                        onValueChange={(value) =>
                                            handleLearningNotificationToggle('goals', value)
                                        }
                                    />
                                </View>
                                <View style={styles.settingItem}>
                                    <Text style={styles.settingLabel}>퀴즈 알림</Text>
                                    <Switch
                                        value={learningNotifications.quiz}
                                        onValueChange={(value) =>
                                            handleLearningNotificationToggle('quiz', value)
                                        }
                                    />
                                </View>
                                <View style={styles.settingItem}>
                                    <Text style={styles.settingLabel}>학습 리마인더</Text>
                                    <Switch
                                        value={learningNotifications.reminders}
                                        onValueChange={(value) =>
                                            handleLearningNotificationToggle('reminders', value)
                                        }
                                    />
                                </View>
                                <View style={styles.settingItem}>
                                    <Text style={styles.settingLabel}>업데이트 알림</Text>
                                    <Switch
                                        value={learningNotifications.updates}
                                        onValueChange={(value) =>
                                            handleLearningNotificationToggle('updates', value)
                                        }
                                    />
                                </View>
                            </>
                        )
                    })}

                    {/* 하단 버튼 */}
                    <View style={styles.bottomButtons}>
                        <TouchableOpacity
                            style={[styles.button, styles.resetButton]}
                            onPress={resetSettings}
                        >
                            <Text style={styles.buttonText}>초기화</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={() => {
                                if (hasUnsavedChanges) {
                                    Alert.alert(
                                        '변경사항 저장',
                                        '변경된 설정을 저장하시겠습니까?',
                                        [
                                            {
                                                text: '저장',
                                                onPress: async () => {
                                                    await saveSettings();
                                                    navigation.goBack();
                                                }
                                            },
                                            {
                                                text: '저장하지 않음',
                                                onPress: () => navigation.goBack(),
                                                style: 'cancel'
                                            }
                                        ]
                                    );
                                } else {
                                    navigation.goBack();
                                }
                            }}
                        >
                            <Text style={styles.buttonText}>취소</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}
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
        fontFamily: 'SFProDisplay-Bold',
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
        fontFamily: 'SFProText-Semibold',
        color: '#333333',
        marginBottom: 16,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    settingLabel: {
        fontSize: 16,
        fontFamily: 'SFProText-Regular',
        color: '#333333',
    },
    timeRangeContainer: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    timeRangeText: {
        fontSize: 16,
        fontFamily: 'SFProText-Medium',
        color: '#333333',
        marginBottom: 8,
    },
    timeSlider: {
        width: '100%',
        height: 40,
        marginVertical: 8,
    },
    priorityContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    priorityButton: {
        flex: 1,
        padding: 12,
        marginHorizontal: 4,
        borderRadius: 8,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
    },
    priorityButtonActive: {
        backgroundColor: '#4A90E2',
    },
    priorityButtonText: {
        fontSize: 14,
        fontFamily: 'SFProText-Medium',
        color: '#333333',
    },
    bottomButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        marginBottom: Platform.OS === 'ios' ? 34 : 16,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        minWidth: 120,
        alignItems: 'center',
    },
    resetButton: {
        backgroundColor: '#FF3B30',
    },
    cancelButton: {
        backgroundColor: '#757575',
    },
    buttonText: {
        fontSize: 16,
        fontFamily: 'SFProText-Semibold',
        color: '#FFFFFF',
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
        fontFamily: 'SFProDisplay-Bold',
        color: '#333333',
        marginBottom: 16,
    },
    modalText: {
        fontSize: 16,
        fontFamily: 'SFProText-Regular',
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
    progressText: {
        marginTop: 16,
        fontSize: 16,
        fontFamily: 'SFProText-Regular',
        color: '#333333',
    },
});

export default NotificationSettingsScreen;