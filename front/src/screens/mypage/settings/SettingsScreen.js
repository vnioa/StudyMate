import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../../api/api';

const SettingItem = ({ title, onPress, rightElement, hasArrow = true }) => (
    <TouchableOpacity
        style={styles.settingItem}
        onPress={onPress}
        disabled={!onPress}
    >
        <Text style={styles.settingTitle}>{title}</Text>
        <View style={styles.rightContainer}>
            {rightElement}
            {hasArrow && <Icon name="chevron-right" size={20} color="#666" />}
        </View>
    </TouchableOpacity>
);

const SettingSection = ({ children, title }) => (
    <View style={styles.section}>
        {title && <Text style={styles.sectionTitle}>{title}</Text>}
        <View style={styles.sectionContent}>
            {children}
        </View>
    </View>
);

const SettingsScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [settings, setSettings] = useState({
        isDarkMode: false,
        displayMode: 'light',
        fontSize: 'medium',
        notifications: {
            push: true,
            email: true
        },
        theme: {
            highContrast: false,
            reducedMotion: false
        }
    });

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('jwt');
            if (!token) {
                throw new Error('인증 토큰이 없습니다.');
            }

            const response = await api.get('/settings', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data) {
                setSettings(response.data);
                await AsyncStorage.setItem('settings', JSON.stringify(response.data));
            }
        } catch (error) {
            Alert.alert('오류', '설정을 불러오는데 실패했습니다.');
            const cachedSettings = await AsyncStorage.getItem('settings');
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
            fetchSettings();
            return () => setSettings({
                isDarkMode: false,
                displayMode: 'light',
                fontSize: 'medium',
                notifications: {
                    push: true,
                    email: true
                },
                theme: {
                    highContrast: false,
                    reducedMotion: false
                }
            });
        }, [fetchSettings])
    );

    const handleSettingUpdate = useCallback(async (key, value) => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('jwt');
            if (!token) {
                throw new Error('인증 토큰이 없습니다.');
            }

            const response = await api.put('/settings',
                { [key]: value },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                const newSettings = { ...settings, [key]: value };
                setSettings(newSettings);
                await AsyncStorage.setItem('settings', JSON.stringify(newSettings));
            }
        } catch (error) {
            Alert.alert('오류', '설정 변경에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [settings]);

    const handleLogout = useCallback(async () => {
        Alert.alert(
            '로그아웃',
            '정말 로그아웃 하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '로그아웃',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const token = await AsyncStorage.getItem('jwt');
                            if (token) {
                                await api.post('/auth/logout', null, {
                                    headers: {
                                        'Authorization': `Bearer ${token}`
                                    }
                                });
                            }
                            await AsyncStorage.clear();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }]
                            });
                        } catch (error) {
                            Alert.alert('오류', '로그아웃에 실패했습니다.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    }, [navigation]);

    if (loading && !settings.language) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>설정</Text>
            </View>

            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={fetchSettings}
                        colors={['#4A90E2']}
                    />
                }
            >
                <SettingSection title="알림">
                    <SettingItem
                        title="알림 설정"
                        onPress={() => navigation.navigate('NotificationSettings')}
                    />
                </SettingSection>

                <SettingSection title="개인정보 및 데이터">
                    <SettingItem
                        title="개인정보 설정"
                        onPress={() => navigation.navigate('PrivacySettings')}
                    />
                    <SettingItem
                        title="설정 백업 및 복원"
                        onPress={() => navigation.navigate('SettingsBackup')}
                    />
                </SettingSection>

                <SettingSection title="접근성">
                    <SettingItem
                        title="화면 모드"
                        rightElement={
                            <Text style={styles.rightText}>
                                {settings.displayMode === 'light' ? '라이트' : '다크'}
                            </Text>
                        }
                        onPress={() => navigation.navigate('DisplayMode')}
                    />
                    <SettingItem
                        title="글자 크기"
                        rightElement={
                            <Text style={styles.rightText}>{settings.fontSize}</Text>
                        }
                        onPress={() => navigation.navigate('FontSize')}
                    />
                    <SettingItem
                        title="고대비 모드"
                        rightElement={
                            <Switch
                                value={settings.theme.highContrast}
                                onValueChange={(value) =>
                                    handleSettingUpdate('theme.highContrast', value)
                                }
                                trackColor={{ false: "#767577", true: "#4A90E2" }}
                                thumbColor={settings.theme.highContrast ? "#fff" : "#f4f3f4"}
                                disabled={loading}
                            />
                        }
                        hasArrow={false}
                    />
                </SettingSection>

                <View style={styles.bottomButtons}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                        disabled={loading}
                    >
                        <Text style={styles.logoutText}>로그아웃</Text>
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
        padding: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '600',
    },
    section: {
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f8f9fa',
    },
    sectionContent: {
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    settingTitle: {
        fontSize: 16,
        color: '#333',
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    rightText: {
        fontSize: 14,
        color: '#666',
    },
    bottomButtons: {
        padding: 16,
        gap: 12,
    },
    logoutButton: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    logoutText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
    }
});

export default SettingsScreen;