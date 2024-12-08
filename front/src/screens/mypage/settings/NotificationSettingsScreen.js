import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";

const api = axios.create({
    baseURL: 'http://121.127.165.43/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

const NotificationSettingsScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [settings, setSettings] = useState({
        study: {
            achievement: { push: true, email: true, sound: true, vibration: true },
            quiz: { push: true, email: true, sound: true, vibration: true }
        },
        account: {
            security: { push: true, email: true, sound: true, vibration: true }
        },
        schedule: {
            weekday: { start: '09:00', end: '19:00', enabled: true },
            weekend: { start: '10:00', end: '16:00', enabled: true }
        }
    });

    const checkNotificationPermissions = useCallback(async () => {
        try {
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== 'granted') {
                const { status: newStatus } = await Notifications.requestPermissionsAsync();
                if (newStatus !== 'granted') {
                    Alert.alert(
                        '알림 권한',
                        '알림 설정을 위해서는 권한이 필요합니다.',
                        [
                            { text: '취소', style: 'cancel' },
                            {
                                text: '설정으로 이동',
                                onPress: async () => {
                                    await api.post('/settings/open');
                                }
                            }
                        ]
                    );
                }
            }
        } catch (error) {
            console.error('Permission check failed:', error);
        }
    }, []);

    const fetchNotificationSettings = useCallback(async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('jwt');
            if (!token) {
                throw new Error('인증 토큰이 없습니다.');
            }

            const response = await api.get('/notifications/settings', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data) {
                setSettings(response.data);
                await AsyncStorage.setItem('notificationSettings', JSON.stringify(response.data));
            }
        } catch (error) {
            Alert.alert('오류', '설정을 불러오는데 실패했습니다.');
            const cachedSettings = await AsyncStorage.getItem('notificationSettings');
            if (cachedSettings) {
                setSettings(JSON.parse(cachedSettings));
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            checkNotificationPermissions();
            fetchNotificationSettings();
            return () => setSettings({
                study: {
                    achievement: { push: true, email: true, sound: true, vibration: true },
                    quiz: { push: true, email: true, sound: true, vibration: true }
                },
                account: {
                    security: { push: true, email: true, sound: true, vibration: true }
                },
                schedule: {
                    weekday: { start: '09:00', end: '19:00', enabled: true },
                    weekend: { start: '10:00', end: '16:00', enabled: true }
                }
            });
        }, [checkNotificationPermissions, fetchNotificationSettings])
    );

    const handleSettingChange = useCallback(async (category, type, setting, value) => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('jwt');
            if (!token) {
                throw new Error('인증 토큰이 없습니다.');
            }

            const response = await api.put('/notifications/settings',
                { category, type, setting, value },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setSettings(prev => ({
                    ...prev,
                    [category]: {
                        ...prev[category],
                        [type]: {
                            ...prev[category][type],
                            [setting]: value
                        }
                    }
                }));
            }
        } catch (error) {
            Alert.alert('오류', '설정 변경에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, []);

    const renderSettingItem = useCallback((title, description, category, type, setting) => (
        <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{title}</Text>
                <Text style={styles.settingDescription}>{description}</Text>
            </View>
            <Switch
                value={settings[category][type][setting]}
                onValueChange={(value) => handleSettingChange(category, type, setting, value)}
                trackColor={{ false: '#767577', true: '#4A90E2' }}
                thumbColor={settings[category][type][setting] ? '#fff' : '#f4f3f4'}
                disabled={loading}
            />
        </View>
    ), [settings, handleSettingChange, loading]);

    if (loading && !settings.study) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>알림 설정</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={fetchNotificationSettings}
                        colors={['#4A90E2']}
                    />
                }
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>학습</Text>
                    {renderSettingItem(
                        '목표 달성 알림',
                        '학습 목표 달성 시 알림을 받습니다',
                        'study',
                        'achievement',
                        'push'
                    )}
                    {renderSettingItem(
                        '퀴즈 알림',
                        '새로운 퀴즈가 있을 때 알림을 받습니다',
                        'study',
                        'quiz',
                        'push'
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>계정</Text>
                    {renderSettingItem(
                        '보안 알림',
                        '계정 보안 관련 알림을 받습니다',
                        'account',
                        'security',
                        'push'
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>알림 시간</Text>
                    <TouchableOpacity
                        style={styles.scheduleItem}
                        onPress={() => navigation.navigate('NotificationSchedule', {
                            type: 'weekday',
                            schedule: settings.schedule.weekday,
                            onUpdate: fetchNotificationSettings
                        })}
                    >
                        <View>
                            <Text style={styles.scheduleTitle}>평일</Text>
                            <Text style={styles.scheduleTime}>
                                {settings.schedule.weekday.start} ~ {settings.schedule.weekday.end}
                            </Text>
                        </View>
                        <Icon name="chevron-right" size={20} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.scheduleItem}
                        onPress={() => navigation.navigate('NotificationSchedule', {
                            type: 'weekend',
                            schedule: settings.schedule.weekend,
                            onUpdate: fetchNotificationSettings
                        })}
                    >
                        <View>
                            <Text style={styles.scheduleTitle}>주말</Text>
                            <Text style={styles.scheduleTime}>
                                {settings.schedule.weekend.start} ~ {settings.schedule.weekend.end}
                            </Text>
                        </View>
                        <Icon name="chevron-right" size={20} color="#666" />
                    </TouchableOpacity>
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
        paddingTop: Platform.OS === 'ios' ? 60 : 16,
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
    },
    section: {
        backgroundColor: '#fff',
        marginBottom: 16,
        paddingVertical: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
        color: '#333',
    },
    settingDescription: {
        fontSize: 14,
        color: '#666',
    },
    scheduleItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    scheduleTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
        color: '#333',
    },
    scheduleTime: {
        fontSize: 14,
        color: '#666',
    }
});

export default NotificationSettingsScreen;