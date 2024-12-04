import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Switch,
    Alert,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { chatAPI } from '../../../services/api';
import { theme } from '../../../styles/theme';
import ChangeNameModal from './ChangeNameModal';

const SettingItem = memo(({ icon, title, subtext, onPress, rightElement }) => (
    <TouchableOpacity
        style={styles.settingItem}
        onPress={onPress}
        disabled={!onPress}
    >
        <View style={styles.settingLeft}>
            <Icon name={icon} size={20} color={theme.colors.text} />
            <View>
                <Text style={styles.settingText}>{title}</Text>
                {subtext && <Text style={styles.settingSubtext}>{subtext}</Text>}
            </View>
        </View>
        {rightElement}
    </TouchableOpacity>
));

const ThemeModal = memo(({ visible, onClose, currentTheme, onThemeChange }) => (
    <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
    >
        <TouchableOpacity
            style={styles.modalOverlay}
            onPress={onClose}
            activeOpacity={1}
        >
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>테마 설정</Text>
                {['light', 'dark', 'system'].map((theme) => (
                    <TouchableOpacity
                        key={theme}
                        style={styles.modalOption}
                        onPress={() => {
                            onThemeChange(theme);
                            onClose();
                        }}
                    >
                        <Text style={styles.modalOptionText}>
                            {theme === 'light' ? '라이트 모드' :
                                theme === 'dark' ? '다크 모드' : '시스템 설정'}
                        </Text>
                        {currentTheme === theme && (
                            <Icon name="check" size={20} color={theme.colors.primary} />
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </TouchableOpacity>
    </Modal>
));

const ChatRoomSettingsScreen = ({ navigation, route }) => {
    const { roomId } = route.params;
    const [loading, setLoading] = useState(false);
    
    const [roomSettings, setRoomSettings] = useState({
        notification: true,
        encryption: true,
        theme: 'light',
        roomName: '',
        participants: []
    });
    const [showThemeModal, setShowThemeModal] = useState(false);
    const [isNameModalVisible, setIsNameModalVisible] = useState(false);

    const fetchRoomSettings = useCallback(async () => {
        try {
            setLoading(true);
            const response = await chatAPI.getRoomDetail(roomId);
            // response 데이터 구조 확인 및 기본값 설정
            setRoomSettings({
                notification: response?.notification ?? true,
                encryption: response?.encryption ?? true,
                theme: response?.theme ?? 'light',
                roomName: response?.roomName ?? '',
                participants: response?.participants ?? []  // 빈 배열을 기본값으로 설정
            });
        } catch (error) {
            Alert.alert('오류', error.message || '설정을 불러오는데 실패했습니다');
            // 에러 발생 시에도 기본값 설정
            setRoomSettings({
                notification: true,
                encryption: true,
                theme: 'light',
                roomName: '',
                participants: []
            });
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    useFocusEffect(
        useCallback(() => {
            fetchRoomSettings();
        }, [fetchRoomSettings])
    );

    const handleSettingChange = useCallback(async (setting, value) => {
        try {
            setLoading(true);
            await chatAPI.updateRoomSettings(roomId, { [setting]: value });
            setRoomSettings(prev => ({ ...prev, [setting]: value }));
        } catch (error) {
            Alert.alert('오류', error.message || '설정 변경에 실패했습니다');
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    const handleParticipantManagement = useCallback(() => {
        navigation.navigate('ParticipantManagement', {
            roomId,
            participants: roomSettings.participants,
            onUpdate: fetchRoomSettings
        });
    }, [roomId, roomSettings.participants, fetchRoomSettings]);

    const handleRoomNameChange = useCallback(() => {
        setIsNameModalVisible(true);
    }, []);

    const handleLeaveChat = useCallback(() => {
        Alert.alert(
            '채팅방 나가기',
            '정말로 이 채팅방을 나가시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '나가기',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await chatAPI.deleteRoom(roomId);
                            navigation.navigate('ChatList');
                        } catch (error) {
                            Alert.alert('오류', error.message || '채팅방을 나가는데 실패했습니다');
                        }
                    },
                },
            ]
        );
    }, [roomId, navigation]);

    if (loading && !roomSettings.roomName) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon name="arrow-left" size={24} color={theme.colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>채팅방 설정</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.section}>
                    <SettingItem
                        icon="edit-2"
                        title="채팅방 이름"
                        subtext={roomSettings.roomName}
                        onPress={handleRoomNameChange}
                        rightElement={
                            <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
                        }
                    />
                    <SettingItem
                        icon="users"
                        title="참여자 관리"
                        subtext={`${roomSettings?.participants?.length || 0}명 참여 중`}
                        onPress={handleParticipantManagement}
                        rightElement={
                            <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
                        }
                    />
                </View>

                <View style={styles.section}>
                    <SettingItem
                        icon="bell"
                        title="알림 설정"
                        rightElement={
                            <Switch
                                value={roomSettings.notification}
                                onValueChange={(value) => handleSettingChange('notification', value)}
                                trackColor={{
                                    false: theme.colors.inactive,
                                    true: theme.colors.primary
                                }}
                            />
                        }
                    />
                    <SettingItem
                        icon="layout"
                        title="테마 설정"
                        onPress={() => setShowThemeModal(true)}
                        rightElement={
                            <Text style={styles.themeText}>
                                {roomSettings.theme === 'light' ? '라이트' : '다크'}
                            </Text>
                        }
                    />
                </View>

                <TouchableOpacity
                    style={[styles.settingItem, styles.leaveChat]}
                    onPress={handleLeaveChat}
                >
                    <View style={styles.settingLeft}>
                        <Icon name="log-out" size={20} color={theme.colors.error} />
                        <Text style={[styles.settingText, styles.leaveText]}>
                            채팅방 나가기
                        </Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>

            <ThemeModal
                visible={showThemeModal}
                onClose={() => setShowThemeModal(false)}
                currentTheme={roomSettings.theme}
                onThemeChange={(theme) => handleSettingChange('theme', theme)}
            />

            <ChangeNameModal
                visible={isNameModalVisible}
                onClose={() => setIsNameModalVisible(false)}
                onSuccess={handleNameChangeSuccess}
                currentName={roomSettings.roomName}
                title="채팅방 이름 변경"
                placeholder="새로운 채팅방 이름을 입력하세요"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    headerTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        backgroundColor: theme.colors.surface,
        marginTop: theme.spacing.md,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: theme.colors.border,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingText: {
        ...theme.typography.bodyLarge,
        marginLeft: theme.spacing.md,
        color: theme.colors.text,
    },
    settingSubtext: {
        ...theme.typography.bodyMedium,
        marginLeft: theme.spacing.md,
        marginTop: 2,
        color: theme.colors.textSecondary,
    },
    leaveChat: {
        marginTop: theme.spacing.lg,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: theme.colors.border,
    },
    leaveText: {
        color: theme.colors.error,
    },
    themeText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.large,
        padding: theme.spacing.lg,
        ...Platform.select({
            ios: theme.shadows.large,
            android: { elevation: 5 }
        }),
    },
    modalTitle: {
        ...theme.typography.headlineSmall,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
        color: theme.colors.text,
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    modalOptionText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
});

export default memo(ChatRoomSettingsScreen);