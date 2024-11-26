import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { settingsAPI } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        isDarkMode: false,
        language: 'ko',
        displayMode: 'light',
        fontSize: 'medium',
        privacyStatus: 'public'
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await settingsAPI.getSettings();
            setSettings(response.data);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '설정을 불러오는데 실패했습니다.');
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            '로그아웃',
            '정말 로그아웃 하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '로그아웃',
                    onPress: async () => {
                        try {
                            await settingsAPI.logout();
                            await AsyncStorage.clear();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }]
                            });
                        } catch (error) {
                            Alert.alert('오류', '로그아웃에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            '계정 삭제',
            '정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await settingsAPI.deleteAccount();
                            await AsyncStorage.clear();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }]
                            });
                        } catch (error) {
                            Alert.alert('오류', '계정 삭제에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    const handleToggleDarkMode = async (value) => {
        try {
            const response = await settingsAPI.updateSettings({
                isDarkMode: value
            });
            if (response.data.success) {
                setSettings(prev => ({
                    ...prev,
                    isDarkMode: value
                }));
                await AsyncStorage.setItem('isDarkMode', value.toString());
            }
        } catch (error) {
            Alert.alert('오류', '설정 변경에 실패했습니다.');
        }
    };

    // SettingItem and SettingSection components remain the same...

    return (
        <View style={styles.container}>
            {/* Header remains the same... */}

            <ScrollView>
                {/* Notification section */}
                <SettingSection>
                    <SettingItem
                        title="알림"
                        onPress={() => navigation.navigate('Notification')}
                    />
                </SettingSection>

                {/* Account section */}
                <SettingSection>
                    <SettingItem title="계정" hasArrow={false} />
                    <SettingItem
                        title="정보 수정"
                        onPress={() => navigation.navigate('EditInfo')}
                    />
                    <SettingItem
                        title="연동된 소셜 계정"
                        onPress={() => navigation.navigate('SocialAccounts')}
                    />
                </SettingSection>

                {/* Privacy section */}
                <SettingSection>
                    <SettingItem title="개인정보 및 데이터" hasArrow={false} />
                    <SettingItem
                        title="프로필 공개 범위"
                        rightElement={<Text style={styles.rightText}>{settings.privacyStatus === 'public' ? '공개' : '비공개'}</Text>}
                        onPress={() => navigation.navigate('PrivacySetting')}
                    />
                    <SettingItem
                        title="데이터 백업 및 복원"
                        onPress={() => navigation.navigate('Backup')}
                    />
                    <SettingItem
                        title="데이터 저장 위치 선택"
                        onPress={() => navigation.navigate('DataStorage')}
                    />
                    <SettingItem
                        title="설정 백업 및 복원"
                        onPress={() => navigation.navigate('SettingsBackup')}
                    />
                </SettingSection>

                {/* Accessibility section */}
                <SettingSection>
                    <SettingItem title="접근성" hasArrow={false} />
                    <SettingItem
                        title="화면 모드"
                        rightElement={<Text style={styles.rightText}>{settings.displayMode === 'light' ? '라이트' : '다크'}</Text>}
                        onPress={() => navigation.navigate('DisplayMode')}
                    />
                    <SettingItem
                        title="언어"
                        rightElement={<Text style={styles.rightText}>{settings.language === 'ko' ? '한국어' : 'English'}</Text>}
                        onPress={() => navigation.navigate('Language')}
                    />
                    <SettingItem
                        title="고대비 모드"
                        rightElement={
                            <Switch
                                value={settings.isDarkMode}
                                onValueChange={handleToggleDarkMode}
                                trackColor={{ false: "#767577", true: "#0066FF" }}
                            />
                        }
                        hasArrow={false}
                    />
                    <SettingItem
                        title="글자 크기"
                        rightElement={<Text style={styles.rightText}>{settings.fontSize}</Text>}
                        onPress={() => navigation.navigate('FontSize')}
                    />
                </SettingSection>

                <View style={styles.bottomButtons}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <Text style={styles.logoutText}>로그아웃</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.deleteAccountButton}
                        onPress={handleDeleteAccount}
                    >
                        <Text style={styles.deleteAccountText}>계정 삭제</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

// Styles remain the same...

export default SettingsScreen;