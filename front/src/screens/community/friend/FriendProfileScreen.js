import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Pressable,
    Alert,
    ActivityIndicator,
    Platform,
    ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../../styles/theme';
import { Picker } from '@react-native-picker/picker';
import Modal from 'react-native-modal';
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const BASE_URL = 'http://121.127.165.43:3000';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

const SettingButton = memo(({ icon, title, onPress, color, disabled }) => (
    <Pressable
        style={[
            styles.settingItem,
            disabled && styles.settingItemDisabled
        ]}
        onPress={onPress}
        disabled={disabled}
    >
        <Icon
            name={icon}
            size={24}
            color={disabled ? theme.colors.textDisabled : (color || theme.colors.text)}
        />
        <Text style={[
            styles.settingText,
            { color: disabled ? theme.colors.textDisabled : (color || theme.colors.text) }
        ]}>
            {title}
        </Text>
    </Pressable>
));

const CommonGroupItem = memo(({ group, isOnline }) => (
    <View style={[
        styles.groupItem,
        !isOnline && styles.groupItemDisabled
    ]}>
        <Text style={[
            styles.groupName,
            !isOnline && styles.textDisabled
        ]}>
            {group.name}
        </Text>
        <Text style={[
            styles.groupMembers,
            !isOnline && styles.textDisabled
        ]}>
            {group.memberCount}명
        </Text>
    </View>
));

const FriendProfileScreen = ({ route, navigation }) => {
    const { friendId } = route.params;
    const [loading, setLoading] = useState(false);
    const [friend, setFriend] = useState(null);
    const [isBlocked, setIsBlocked] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [commonGroups, setCommonGroups] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    api.interceptors.request.use(
        async (config) => {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    const checkNetwork = async () => {
        const state = await NetInfo.fetch();
        if (!state.isConnected) {
            setIsOnline(false);
            Alert.alert('네트워크 오류', '인터넷 연결을 확인해주세요.');
            return false;
        }
        setIsOnline(true);
        return true;
    };

    const fetchFriendProfile = useCallback(async () => {
        if (!(await checkNetwork())) {
            const cachedData = await AsyncStorage.getItem(`friendProfile_${friendId}`);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                setFriend(parsed.friend);
                setIsBlocked(parsed.isBlocked);
                setIsHidden(parsed.isHidden);
                setCommonGroups(parsed.commonGroups);
            }
            return;
        }

        try {
            setLoading(true);
            const response = await api.get(`/api/friends/${friendId}/profile`);
            if (response.data.success) {
                setFriend(response.data.friend);
                setIsBlocked(response.data.isBlocked);
                setIsHidden(response.data.isHidden);
                setCommonGroups(response.data.commonGroups);
                await AsyncStorage.setItem(`friendProfile_${friendId}`,
                    JSON.stringify(response.data));
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '프로필을 불러오는데 실패했습니다',
                [{ text: '확인', onPress: () => navigation.goBack() }]
            );
        } finally {
            setLoading(false);
        }
    }, [friendId, navigation]);

    const fetchGroups = useCallback(async () => {
        if (!(await checkNetwork())) {
            const cachedGroups = await AsyncStorage.getItem('friendGroups');
            if (cachedGroups) {
                setGroups(JSON.parse(cachedGroups));
            }
            return;
        }

        try {
            const response = await api.get('/api/friends/groups');
            if (response.data.success) {
                setGroups(response.data.groups || []);
                await AsyncStorage.setItem('friendGroups',
                    JSON.stringify(response.data.groups));
            }
        } catch (error) {
            Alert.alert('오류',
                error.response?.data?.message || '그룹 목록을 불러오는데 실패했습니다');
        }
    }, []);

    const handleUpdateGroup = useCallback(async (group) => {
        if (!(await checkNetwork())) return;

        try {
            setLoading(true);
            const response = await api.put(`/api/friends/${friendId}/group`, { group });
            if (response.data.success) {
                setSelectedGroup(group);
                Alert.alert('성공', '친구 그룹이 변경되었습니다');
                setIsGroupModalVisible(false);
            }
        } catch (error) {
            Alert.alert('오류',
                error.response?.data?.message || '그룹 변경에 실패했습니다');
        } finally {
            setLoading(false);
        }
    }, [friendId]);

    useFocusEffect(
        useCallback(() => {
            fetchFriendProfile();
            fetchGroups();
            const unsubscribe = NetInfo.addEventListener(state => {
                setIsOnline(state.isConnected);
            });
            return () => {
                unsubscribe();
                setFriend(null);
                setCommonGroups([]);
                setGroups([]);
            };
        }, [fetchFriendProfile, fetchGroups])
    );

    const handleBlock = useCallback(async () => {
        if (!(await checkNetwork())) return;

        try {
            setLoading(true);
            const response = await api.put(`/api/friends/${friendId}/block`);
            if (response.data.success) {
                setIsBlocked(response.data.isBlocked);
                Alert.alert('알림',
                    isBlocked ? '차단이 해제되었습니다.' : '차단되었습니다.');
            }
        } catch (error) {
            Alert.alert('오류',
                error.response?.data?.message || '작업을 처리하는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [friendId, isBlocked]);

    const handleHide = useCallback(async () => {
        if (!(await checkNetwork())) return;

        try {
            setLoading(true);
            const response = await api.put(`/api/friends/${friendId}/hide`);
            if (response.data.success) {
                setIsHidden(response.data.isHidden);
                Alert.alert('알림',
                    isHidden ? '숨김이 해제되었습니다.' : '숨김 처리되었습니다.');
            }
        } catch (error) {
            Alert.alert('오류',
                error.response?.data?.message || '작업을 처리하는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [friendId, isHidden]);

    const handleDeleteFriend = useCallback(() => {
        if (!isOnline) return;

        Alert.alert(
            '친구 삭제',
            '정말로 이 친구를 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await api.delete(`/api/friends/${friendId}`);
                            if (response.data.success) {
                                Alert.alert('알림', '친구가 삭제되었습니다.', [
                                    { text: '확인', onPress: () => navigation.goBack() }
                                ]);
                            }
                        } catch (error) {
                            Alert.alert('오류',
                                error.response?.data?.message || '친구 삭제에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    }, [friendId, navigation, isOnline]);

    const handleStartChat = useCallback(async () => {
        if (!(await checkNetwork())) return;

        try {
            const response = await api.post('/api/chat/rooms', {
                friendId: friendId
            });
            if (response.data.success) {
                navigation.navigate('ChatRoom', {
                    roomId: response.data.roomId,
                    roomName: friend?.name
                });
            }
        } catch (error) {
            Alert.alert('오류',
                error.response?.data?.message || '채팅을 시작할 수 없습니다.');
        }
    }, [friendId, friend, navigation]);

    const GroupModal = () => (
        <Modal
            isVisible={isGroupModalVisible}
            onBackdropPress={() => setIsGroupModalVisible(false)}
            style={styles.modal}
        >
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>그룹 선택</Text>
                <Picker
                    selectedValue={selectedGroup}
                    onValueChange={(value) => handleUpdateGroup(value)}
                    style={styles.picker}
                >
                    <Picker.Item label="그룹 없음" value="" />
                    {groups.map((group) => (
                        <Picker.Item key={group} label={group} value={group} />
                    ))}
                </Picker>
            </View>
        </Modal>
    );

    if (loading && !friend) {
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
                <Text style={styles.headerTitle}>프로필</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.profileSection}>
                    <View style={styles.profileImage}>
                        {friend?.avatar ? (
                            <Image source={{ uri: friend.avatar }} style={styles.avatar} />
                        ) : (
                            <Icon
                                name="user"
                                size={40}
                                color={theme.colors.textSecondary}
                            />
                        )}
                    </View>
                    <Text style={styles.name}>{friend?.name}</Text>
                    <Text style={styles.statusMessage}>
                        {friend?.statusMessage || '상태 메시지가 없습니다'}
                    </Text>
                </View>

                {commonGroups.length > 0 && (
                    <View style={styles.groupsSection}>
                        <Text style={styles.sectionTitle}>함께 있는 그룹</Text>
                        {commonGroups.map(group => (
                            <CommonGroupItem
                                key={group.id}
                                group={group}
                                isOnline={isOnline}
                            />
                        ))}
                    </View>
                )}

                <Pressable
                    style={[
                        styles.chatButton,
                        !isOnline && styles.buttonDisabled
                    ]}
                    onPress={handleStartChat}
                    disabled={loading || !isOnline}
                >
                    <Icon
                        name="message-circle"
                        size={24}
                        color={isOnline ? theme.colors.white : theme.colors.textDisabled}
                    />
                    <Text style={[
                        styles.chatButtonText,
                        !isOnline && styles.textDisabled
                    ]}>
                        채팅하기
                    </Text>
                </Pressable>

                <View style={styles.settingsSection}>
                    <SettingButton
                        icon={isBlocked ? "unlock" : "lock"}
                        title={isBlocked ? "차단 해제" : "차단하기"}
                        onPress={handleBlock}
                        disabled={loading || !isOnline}
                    />
                    <SettingButton
                        icon={isHidden ? "eye" : "eye-off"}
                        title={isHidden ? "숨김 해제" : "숨기기"}
                        onPress={handleHide}
                        disabled={loading || !isOnline}
                    />
                    <SettingButton
                        icon="user-x"
                        title="친구 삭제"
                        onPress={handleDeleteFriend}
                        color={theme.colors.error}
                        disabled={loading || !isOnline}
                    />
                    <SettingButton
                        icon="users"
                        title="그룹 변경"
                        onPress={() => setIsGroupModalVisible(true)}
                        disabled={loading || !isOnline}
                    />
                </View>
            </ScrollView>
            <GroupModal />
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
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    headerTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
    },
    content: {
        flex: 1,
    },
    profileSection: {
        alignItems: 'center',
        padding: theme.spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        ...Platform.select({
            ios: theme.shadows.medium,
            android: { elevation: 3 }
        }),
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    name: {
        ...theme.typography.headlineMedium,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    statusMessage: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    groupsSection: {
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
        ...theme.typography.bodyLarge,
        fontWeight: '600',
        marginBottom: theme.spacing.sm,
    },
    groupItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
    },
    groupName: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
    },
    groupMembers: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        margin: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.large,
        ...Platform.select({
            ios: theme.shadows.medium,
            android: { elevation: 3 }
        }),
    },
    chatButtonText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.white,
        marginLeft: theme.spacing.sm,
        fontWeight: '600',
    },
    settingsSection: {
        padding: theme.spacing.md,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderRadius: theme.roundness.medium,
        marginBottom: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
    },
    settingText: {
        ...theme.typography.bodyLarge,
        marginLeft: theme.spacing.md,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    modal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    modalContent: {
        backgroundColor: theme.colors.background,
        padding: theme.spacing.lg,
        borderTopLeftRadius: theme.roundness.large,
        borderTopRightRadius: theme.roundness.large,
    },
    modalTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    picker: {
        backgroundColor: theme.colors.surface,
    },
    textDisabled: {
        color: theme.colors.textDisabled,
    },
    buttonDisabled: {
        opacity: 0.5,
        backgroundColor: theme.colors.disabled,
    },
    groupItemDisabled: {
        opacity: 0.7,
    }
});

export default memo(FriendProfileScreen);