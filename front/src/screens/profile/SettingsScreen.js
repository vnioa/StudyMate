// src/screens/profile/SettingsScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    Platform,
    Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../../contexts/AppContext';
import { theme } from '../../utils/styles';
import api from '../../services/api';

export default function SettingsScreen() {
    const navigation = useNavigation();
    const { dispatch } = useApp();

    // 설정 상태
    const [settings, setSettings] = useState({
        notifications: {
            studyReminder: true,
            groupActivity: true,
            friendRequest: true,
            chat: true,
            marketing: false
        },
        security: {
            biometric: false,
            twoFactor: false,
            autoLock: false
        },
        display: {
            darkMode: false,
            fontSize: 'medium', // small, medium, large
            language: 'ko' // ko, en, ja
        },
        privacy: {
            searchable: true,
            activityStatus: true,
            readReceipt: true
        },
        study: {
            autoPlay: true,
            subtitles: true,
            downloadWiFiOnly: true
        },
        dataUsage: {
            autoDownload: true,
            highQualityVideo: false,
            dataOptimization: true
        }
    });

    // 앱 버전
    const [appVersion, setAppVersion] = useState('1.0.0');
    const [latestVersion, setLatestVersion] = useState(null);

    // 초기 설정 로드
    useEffect(() => {
        loadSettings();
        checkAppVersion();
    }, []);

    // 설정 로드
    const loadSettings = async () => {
        try {
            const savedSettings = await AsyncStorage.getItem('userSettings');
            if (savedSettings) {
                setSettings(JSON.parse(savedSettings));
            }

            // 서버 설정 동기화
            const serverSettings = await api.settings.getSettings();
            const mergedSettings = {
                ...JSON.parse(savedSettings || '{}'),
                ...serverSettings
            };

            setSettings(mergedSettings);
            await AsyncStorage.setItem('userSettings', JSON.stringify(mergedSettings));
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    // 앱 버전 체크
    const checkAppVersion = async () => {
        try {
            const response = await api.app.checkVersion();
            setLatestVersion(response.latestVersion);
        } catch (error) {
            console.error('Failed to check app version:', error);
        }
    };

    // 설정 변경 처리
    const handleSettingChange = async (category, setting, value) => {
        try {
            const newSettings = {
                ...settings,
                [category]: {
                    ...settings[category],
                    [setting]: value
                }
            };

            setSettings(newSettings);
            await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
            await api.settings.updateSettings({ [category]: { [setting]: value } });

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            Alert.alert('오류', '설정 저장에 실패했습니다.');
        }
    };

    // 언어 설정
    const handleLanguageChange = async () => {
        Alert.alert(
            '언어 설정',
            '사용할 언어를 선택하세요',
            [
                {
                    text: '한국어',
                    onPress: () => handleSettingChange('display', 'language', 'ko')
                },
                {
                    text: 'English',
                    onPress: () => handleSettingChange('display', 'language', 'en')
                },
                {
                    text: '日本語',
                    onPress: () => handleSettingChange('display', 'language', 'ja')
                },
                { text: '취소', style: 'cancel' }
            ]
        );
    };

    // 글자 크기 설정
    const handleFontSizeChange = () => {
        Alert.alert(
            '글자 크기',
            '글자 크기를 선택하세요',
            [
                {
                    text: '작게',
                    onPress: () => handleSettingChange('display', 'fontSize', 'small')
                },
                {
                    text: '보통',
                    onPress: () => handleSettingChange('display', 'fontSize', 'medium')
                },
                {
                    text: '크게',
                    onPress: () => handleSettingChange('display', 'fontSize', 'large')
                },
                { text: '취소', style: 'cancel' }
            ]
        );
    };

    // 캐시 삭제
    const handleClearCache = async () => {
        Alert.alert(
            '캐시 삭제',
            '모든 캐시를 삭제하시겠습니까?\n앱의 동작이 느려질 수 있습니다.',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.clear();
                            await api.settings.clearCache();
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert('완료', '캐시가 삭제되었습니다.');
                        } catch (error) {
                            Alert.alert('오류', '캐시 삭제에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    // 로그아웃
    const handleLogout = () => {
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
                            await api.auth.logout();
                            await AsyncStorage.clear();
                            dispatch({ type: 'LOGOUT' });
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (error) {
                            Alert.alert('오류', '로그아웃에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    // 회원 탈퇴
    const handleDeleteAccount = () => {
        Alert.alert(
            '회원 탈퇴',
            '정말 탈퇴하시겠습니까?\n모든 데이터가 영구적으로 삭제됩니다.',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '탈퇴',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.auth.deleteAccount();
                            await AsyncStorage.clear();
                            dispatch({ type: 'LOGOUT' });
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (error) {
                            Alert.alert('오류', '회원 탈퇴에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            {/* 알림 설정 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>알림</Text>

                <View style={styles.settingItem}>
                    <View style={styles.settingLabel}>
                        <Text style={styles.settingText}>학습 알림</Text>
                        <Text style={styles.settingDescription}>
                            학습 일정 및 목표 알림을 받습니다
                        </Text>
                    </View>
                    <Switch
                        value={settings.notifications.studyReminder}
                        onValueChange={(value) =>
                            handleSettingChange('notifications', 'studyReminder', value)
                        }
                        trackColor={{
                            false: theme.colors.grey[200],
                            true: theme.colors.primary.main + '50'
                        }}
                        thumbColor={settings.notifications.studyReminder
                            ? theme.colors.primary.main
                            : theme.colors.grey[400]
                        }
                    />
                </View>

                <View style={styles.settingItem}>
                    <View style={styles.settingLabel}>
                        <Text style={styles.settingText}>그룹 활동</Text>
                        <Text style={styles.settingDescription}>
                            그룹 활동 및 공지사항 알림을 받습니다
                        </Text>
                    </View>
                    <Switch
                        value={settings.notifications.groupActivity}
                        onValueChange={(value) =>
                            handleSettingChange('notifications', 'groupActivity', value)
                        }
                        trackColor={{
                            false: theme.colors.grey[200],
                            true: theme.colors.primary.main + '50'
                        }}
                        thumbColor={settings.notifications.groupActivity
                            ? theme.colors.primary.main
                            : theme.colors.grey[400]
                        }
                    />
                </View>

                <View style={styles.settingItem}>
                    <View style={styles.settingLabel}>
                        <Text style={styles.settingText}>친구 요청</Text>
                        <Text style={styles.settingDescription}>
                            친구 요청 알림을 받습니다
                        </Text>
                    </View>
                    <Switch
                        value={settings.notifications.friendRequest}
                        onValueChange={(value) =>
                            handleSettingChange('notifications', 'friendRequest', value)
                        }
                        trackColor={{
                            false: theme.colors.grey[200],
                            true: theme.colors.primary.main + '50'
                        }}
                        thumbColor={settings.notifications.friendRequest
                            ? theme.colors.primary.main
                            : theme.colors.grey[400]
                        }
                    />
                </View>

                <View style={styles.settingItem}>
                    <View style={styles.settingLabel}>
                        <Text style={styles.settingText}>채팅</Text>
                        <Text style={styles.settingDescription}>
                            새로운 메시지 알림을 받습니다
                        </Text>
                    </View>
                    <Switch
                        value={settings.notifications.chat}
                        onValueChange={(value) =>
                            handleSettingChange('notifications', 'chat', value)
                        }
                        trackColor={{
                            false: theme.colors.grey[200],
                            true: theme.colors.primary.main + '50'
                        }}
                        thumbColor={settings.notifications.chat
                            ? theme.colors.primary.main
                            : theme.colors.grey[400]
                        }
                    />
                </View>

                <View style={styles.settingItem}>
                    <View style={styles.settingLabel}>
                        <Text style={styles.settingText}>마케팅</Text>
                        <Text style={styles.settingDescription}>
                            이벤트 및 프로모션 알림을 받습니다
                        </Text>
                    </View>
                    <Switch
                        value={settings.notifications.marketing}
                        onValueChange={(value) =>
                            handleSettingChange('notifications', 'marketing', value)
                        }
                        trackColor={{
                            false: theme.colors.grey[200],
                            true: theme.colors.primary.main + '50'
                        }}
                        thumbColor={settings.notifications.marketing
                            ? theme.colors.primary.main
                            : theme.colors.grey[400]
                        }
                    />
                </View>
            </View>

            {/* 보안 설정 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>보안</Text>

                <View style={styles.settingItem}>
                    <View style={styles.settingLabel}>
                        <Text style={styles.settingText}>생체 인증</Text>
                        <Text style={styles.settingDescription}>
                            앱 실행 시 생체 인증을 사용합니다
                        </Text>
                    </View>
                    <Switch
                        value={settings.security.biometric}
                        onValueChange={(value) =>
                            handleSettingChange('security', 'biometric', value)
                        }
                        trackColor={{
                            false: theme.colors.grey[200],
                            true: theme.colors.primary.main + '50'
                        }}
                        thumbColor={settings.security.biometric
                            ? theme.colors.primary.main
                            : theme.colors.grey[400]
                        }
                    />
                </View>

                <View style={styles.settingItem}>
                    <View style={styles.settingLabel}>
                        <Text style={styles.settingText}>2단계 인증</Text>
                        <Text style={styles.settingDescription}>
                            로그인 시 추가 인증을 요구합니다
                        </Text>
                    </View>
                    <Switch
                        value={settings.security.twoFactor}
                        onValueChange={(value) =>
                            handleSettingChange('security', 'twoFactor', value)
                        }
                        trackColor={{
                            false: theme.colors.grey[200],
                            true: theme.colors.primary.main + '50'
                        }}
                        thumbColor={settings.security.twoFactor
                            ? theme.colors.primary.main
                            : theme.colors.grey[400]
                        }
                    />
                </View>

                <View style={styles.settingItem}>
                    <View style={styles.settingLabel}>
                        <Text style={styles.settingText}>자동 잠금</Text>
                        <Text style={styles.settingDescription}>
                            앱을 일정 시간 사용하지 않으면 잠급니다
                        </Text>
                    </View>
                    <Switch
                        value={settings.security.autoLock}
                        onValueChange={(value) =>
                            handleSettingChange('security', 'autoLock', value)
                        }
                        trackColor={{
                            false: theme.colors.grey[200],
                            true: theme.colors.primary.main + '50'
                        }}
                        thumbColor={settings.security.autoLock
                            ? theme.colors.primary.main
                            : theme.colors.grey[400]
                        }
                    />
                </View>
            </View>

            {/* 화면 설정 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>화면</Text>

                <View style={styles.settingItem}>
                    <View style={styles.settingLabel}>
                        <Text style={styles.settingText}>다크 모드</Text>
                        <Text style={styles.settingDescription}>
                            어두운 테마를 사용합니다
                        </Text>
                    </View>
                    <Switch
                        value={settings.display.darkMode}
                        onValueChange={(value) =>
                            handleSettingChange('display', 'darkMode', value)
                        }
                        trackColor={{
                            false: theme.colors.grey[200],
                            true: theme.colors.primary.main + '50'
                        }}
                        thumbColor={settings.display.darkMode
                            ? theme.colors.primary.main
                            : theme.colors.grey[400]
                        }
                    />
                </View>

                <TouchableOpacity
                    style={styles.settingButton}
                    onPress={handleLanguageChange}
                >
                    <View style={styles.settingLabel}>
                        <Text style={styles.settingText}>언어</Text>
                        <Text style={styles.settingDescription}>
                            앱에서 사용할 언어를 설정합니다
                        </Text>
                    </View>
                    <View style={styles.settingValue}>
                        <Text style={styles.settingValueText}>
                            {settings.display.language === 'ko' ? '한국어' :
                                settings.display.language === 'en' ? 'English' : '日本語'}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.settingButton}
                    onPress={handleFontSizeChange}
                >
                    <View style={styles.settingLabel}>
                        <Text style={styles.settingText}>글자 크기</Text>
                        <Text style={styles.settingDescription}>
                            앱의 글자 크기를 조정합니다
                        </Text>
                    </View>
                    <View style={styles.settingValue}>
                        <Text style={styles.settingValueText}>
                            {settings.display.fontSize === 'small' ? '작게' :
                                settings.display.fontSize === 'medium' ? '보통' : '크게'}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                    </View>
                </TouchableOpacity>
            </View>

            {/* 데이터 설정 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>데이터</Text>

                <View style={styles.settingItem}>
                    <View style={styles.settingLabel}>
                        <Text style={styles.settingText}>자동 다운로드</Text>
                        <Text style={styles.settingDescription}>
                            Wi-Fi 연결 시 자동으로 콘텐츠를 다운로드합니다
                        </Text>
                    </View>
                    <Switch
                        value={settings.dataUsage.autoDownload}
                        onValueChange={(value) =>
                            handleSettingChange('dataUsage', 'autoDownload', value)
                        }
                        trackColor={{
                            false: theme.colors.grey[200],
                            true: theme.colors.primary.main + '50'
                        }}
                        thumbColor={settings.dataUsage.autoDownload
                            ? theme.colors.primary.main
                            : theme.colors.grey[400]
                        }
                    />
                </View>

                <View style={styles.settingItem}>
                    <View style={styles.settingLabel}>
                        <Text style={styles.settingText}>고화질 비디오</Text>
                        <Text style={styles.settingDescription}>
                            고화질로 동영상을 재생합니다
                        </Text>
                    </View>
                    <Switch
                        value={settings.dataUsage.highQualityVideo}
                        onValueChange={(value) =>
                            handleSettingChange('dataUsage', 'highQualityVideo', value)
                        }
                        trackColor={{
                            false: theme.colors.grey[200],
                            true: theme.colors.primary.main + '50'
                        }}
                        thumbColor={settings.dataUsage.highQualityVideo
                            ? theme.colors.primary.main
                            : theme.colors.grey[400]
                        }
                    />
                </View>

                <TouchableOpacity
                    style={styles.settingButton}
                    onPress={handleClearCache}
                >
                    <View style={styles.settingLabel}>
                        <Text style={styles.settingText}>캐시 삭제</Text>
                        <Text style={styles.settingDescription}>
                            임시 파일과 캐시를 삭제합니다
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                </TouchableOpacity>
            </View>

            {/* 앱 정보 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>앱 정보</Text>

                <TouchableOpacity
                    style={styles.settingButton}
                    onPress={() => Linking.openURL('https://studymate.com/terms')}
                >
                    <Text style={styles.settingText}>이용약관</Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.settingButton}
                    onPress={() => Linking.openURL('https://studymate.com/privacy')}
                >
                    <Text style={styles.settingText}>개인정보 처리방침</Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.settingButton}
                    onPress={() => Linking.openURL('https://studymate.com/opensource')}
                >
                    <Text style={styles.settingText}>오픈소스 라이선스</Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                </TouchableOpacity>

                <View style={styles.versionInfo}>
                    <Text style={styles.versionText}>
                        버전 {appVersion}
                        {latestVersion && latestVersion !== appVersion && ' (업데이트 가능)'}
                    </Text>
                    {latestVersion && latestVersion !== appVersion && (
                        <TouchableOpacity
                            style={styles.updateButton}
                            onPress={() => Linking.openURL('https://studymate.com/download')}
                        >
                            <Text style={styles.updateButtonText}>업데이트</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* 계정 관리 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>계정</Text>

                <TouchableOpacity
                    style={styles.settingButton}
                    onPress={handleLogout}
                >
                    <Text style={styles.logoutText}>로그아웃</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.settingButton}
                    onPress={handleDeleteAccount}
                >
                    <Text style={styles.deleteAccountText}>회원 탈퇴</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    section: {
        paddingVertical: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    settingButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    settingLabel: {
        flex: 1,
        marginRight: theme.spacing.md,
    },
    settingText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    settingDescription: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    settingValue: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingValueText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginRight: theme.spacing.sm,
    },
    versionInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    versionText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    updateButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.primary.main,
        borderRadius: theme.layout.components.borderRadius,
    },
    updateButtonText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    },
    logoutText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.primary.main,
    },
    deleteAccountText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.status.error,
    }
});