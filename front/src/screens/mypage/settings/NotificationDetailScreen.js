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
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationDetailScreen = ({ route }) => {
    const { title, type } = route.params;
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [settings, setSettings] = useState({
        pushEnabled: true,
        emailEnabled: true,
        scheduleEnabled: false,
        soundEnabled: true,
        vibrationEnabled: true,
        lastUpdated: null
    });

    useEffect(() => {
        fetchNotificationSettings();
    }, [type]);

    const fetchNotificationSettings = async () => {
        try {
            setLoading(true);
            const response = await settingsAPI.getNotificationSettings(type);
            if (response.data) {
                setSettings(response.data);
                await AsyncStorage.setItem(
                    `notification_settings_${type}`,
                    JSON.stringify(response.data)
                );
            }
        } catch (error) {
            Alert.alert('오류', '설정을 불러오는데 실패했습니다.');
            // Fallback to cached settings
            const cachedSettings = await AsyncStorage.getItem(`notification_settings_${type}`);
            if (cachedSettings) {
                setSettings(JSON.parse(cachedSettings));
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleToggle = async (settingType, value) => {
        try {
            setLoading(true);
            const response = await settingsAPI.updateNotificationSettings(type, {
                [settingType]: value,
                updatedAt: new Date().toISOString()
            });

            if (response.data.success) {
                const newSettings = {
                    ...settings,
                    [settingType]: value,
                    lastUpdated: new Date().toISOString()
                };
                setSettings(newSettings);
                await AsyncStorage.setItem(
                    `notification_settings_${type}`,
                    JSON.stringify(newSettings)
                );

                // 푸시 알림 권한 요청
                if (settingType === 'pushEnabled' && value) {
                    await requestNotificationPermission();
                }
            }
        } catch (error) {
            Alert.alert('오류', '설정 변경에 실패했습니다.');
            setSettings(prev => ({
                ...prev,
                [settingType]: !value
            }));
        } finally {
            setLoading(false);
        }
    };

    const requestNotificationPermission = async () => {
        try {
            const result = await settingsAPI.requestNotificationPermission();
            if (!result.granted) {
                Alert.alert(
                    '알림 권한',
                    '원활한 서비스 이용을 위해 알림 권한이 필요합니다.',
                    [
                        { text: '취소', style: 'cancel' },
                        { text: '설정으로 이동', onPress: openSettings }
                    ]
                );
            }
        } catch (error) {
            console.error('Permission request failed:', error);
        }
    };

    const openSettings = () => {
        settingsAPI.openSystemSettings();
    };

    const renderSettingItem = (title, description, type, value) => (
        <View style={styles.item}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{title}</Text>
                <Text style={styles.itemDescription}>{description}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={(newValue) => handleToggle(type, newValue)}
                trackColor={{ false: '#767577', true: '#4A90E2' }}
                thumbColor={value ? '#fff' : '#f4f3f4'}
                disabled={loading}
                ios_backgroundColor="#3e3e3e"
            />
        </View>
    );

    if (loading && !settings.lastUpdated) {
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
                <Text style={styles.headerTitle}>{title}</Text>
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
                {renderSettingItem(
                    '푸시 알림',
                    '앱 알림을 통해 새로운 소식을 받아보세요',
                    'pushEnabled',
                    settings.pushEnabled
                )}

                {renderSettingItem(
                    '이메일 알림',
                    '이메일로 중요한 알림을 받아보세요',
                    'emailEnabled',
                    settings.emailEnabled
                )}

                {renderSettingItem(
                    '알림음',
                    '알림음을 재생합니다',
                    'soundEnabled',
                    settings.soundEnabled
                )}

                {renderSettingItem(
                    '진동',
                    '알림 시 진동을 울립니다',
                    'vibrationEnabled',
                    settings.vibrationEnabled
                )}

                {settings.lastUpdated && (
                    <Text style={styles.lastUpdated}>
                        마지막 업데이트: {new Date(settings.lastUpdated).toLocaleString()}
                    </Text>
                )}
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
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    itemInfo: {
        flex: 1,
        marginRight: 16,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
        color: '#333',
    },
    itemDescription: {
        fontSize: 14,
        color: '#666',
    },
    lastUpdated: {
        textAlign: 'center',
        color: '#666',
        fontSize: 12,
        marginTop: 16,
        marginBottom: 24,
    }
});

export default NotificationDetailScreen;