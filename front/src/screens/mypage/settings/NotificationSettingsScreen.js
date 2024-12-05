import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { settingsAPI } from '../../../services/api';
import * as Notifications from 'expo-notifications';

const NotificationSettingsScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [settings, setSettings] = useState({
        study: {
            achievement: {
                push: true,
                email: true,
                sound: true,
                vibration: true
            },
            quiz: {
                push: true,
                email: true,
                sound: true,
                vibration: true
            }
        },
        account: {
            security: {
                push: true,
                email: true,
                sound: true,
                vibration: true
            }
        },
        schedule: {
            weekday: {
                start: '09:00',
                end: '19:00',
                enabled: true
            },
            weekend: {
                start: '10:00',
                end: '16:00',
                enabled: true
            }
        }
    });

    useEffect(() => {
        checkNotificationPermissions();
        fetchNotificationSettings();
    }, []);

    const checkNotificationPermissions = async () => {
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
                            { text: '설정으로 이동', onPress: () => settingsAPI.openSettings() }
                        ]
                    );
                }
            }
        } catch (error) {
            console.error('Permission check failed:', error);
        }
    };

    const fetchNotificationSettings = async () => {
        try {
            setLoading(true);
            const response = await settingsAPI.getNotificationSettings();
            if (response.data) {
                setSettings(response.data);
            }
        } catch (error) {
            Alert.alert('오류', '설정을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSettingChange = async (category, type, setting, value) => {
        try {
            setLoading(true);
            const response = await settingsAPI.updateNotificationSetting({
                category,
                type,
                setting,
                value
            });

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
    };

    const renderSettingItem = (title, description, category, type, setting) => (
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
    );

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
                <TouchableOpacity onPress={() => navigation.goBack()}>
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