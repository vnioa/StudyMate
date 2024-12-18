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
import { friendsAPI } from '../../../services/api';
import { theme } from '../../../styles/theme';

const SettingButton = memo(({ icon, title, onPress, color, disabled }) => (
    <Pressable
        style={styles.settingItem}
        onPress={onPress}
        disabled={disabled}
    >
        <Icon name={icon} size={24} color={color || theme.colors.text} />
        <Text style={[styles.settingText, { color: color || theme.colors.text }]}>
            {title}
        </Text>
    </Pressable>
));

const CommonGroupItem = memo(({ group }) => (
    <View style={styles.groupItem}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.groupMembers}>{group.memberCount}명</Text>
    </View>
));

const FriendProfileScreen = ({ route, navigation }) => {
    const { friendId } = route.params;
    const [loading, setLoading] = useState(false);
    const [friend, setFriend] = useState(null);
    const [isBlocked, setIsBlocked] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [commonGroups, setCommonGroups] = useState([]);

    const fetchFriendProfile = useCallback(async () => {
        try {
            setLoading(true);
            const response = await friendAPI.getFriendProfile(friendId);
            if (response.data.success) {
                setFriend(response.data.friend);
                setIsBlocked(response.data.isBlocked);
                setIsHidden(response.data.isHidden);
                setCommonGroups(response.data.commonGroups);
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

    useFocusEffect(
        useCallback(() => {
            fetchFriendProfile();
            return () => {
                setFriend(null);
                setCommonGroups([]);
            };
        }, [fetchFriendProfile])
    );

    const handleBlock = useCallback(async () => {
        try {
            setLoading(true);
            const response = await friendAPI.toggleBlock(friendId);
            if (response.data.success) {
                setIsBlocked(response.data.isBlocked);
                Alert.alert('알림',
                    isBlocked ? '차단이 해제되었습니다.' : '차단되었습니다.'
                );
            }
        } catch (error) {
            Alert.alert('오류', '작업을 처리하는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [friendId, isBlocked]);

    const handleHide = useCallback(async () => {
        try {
            setLoading(true);
            const response = await friendAPI.toggleHide(friendId);
            if (response.data.success) {
                setIsHidden(response.data.isHidden);
                Alert.alert('알림',
                    isHidden ? '숨김이 해제되었습니다.' : '숨김 처리되었습니다.'
                );
            }
        } catch (error) {
            Alert.alert('오류', '작업을 처리하는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [friendId, isHidden]);

    const handleDeleteFriend = useCallback(() => {
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
                            const response = await friendAPI.deleteFriend(friendId);
                            if (response.data.success) {
                                Alert.alert('알림', '친구가 삭제되었습니다.', [
                                    { text: '확인', onPress: () => navigation.goBack() }
                                ]);
                            }
                        } catch (error) {
                            Alert.alert('오류', '친구 삭제에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    }, [friendId, navigation]);

    const handleStartChat = useCallback(async () => {
        try {
            const response = await friendAPI.startChat(friendId);
            if (response.data.success) {
                navigation.navigate('ChatRoom', {
                    roomId: response.data.roomId,
                    roomName: friend?.name
                });
            }
        } catch (error) {
            Alert.alert('오류', '채팅을 시작할 수 없습니다.');
        }
    }, [friendId, friend, navigation]);

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
                            <Image
                                source={{ uri: friend.avatar }}
                                style={styles.avatar}
                            />
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
                            <CommonGroupItem key={group.id} group={group} />
                        ))}
                    </View>
                )}

                <Pressable
                    style={styles.chatButton}
                    onPress={handleStartChat}
                    disabled={loading}
                >
                    <Icon name="message-circle" size={24} color={theme.colors.white} />
                    <Text style={styles.chatButtonText}>채팅하기</Text>
                </Pressable>

                <View style={styles.settingsSection}>
                    <SettingButton
                        icon={isBlocked ? "unlock" : "lock"}
                        title={isBlocked ? "차단 해제" : "차단하기"}
                        onPress={handleBlock}
                        disabled={loading}
                    />
                    <SettingButton
                        icon={isHidden ? "eye" : "eye-off"}
                        title={isHidden ? "숨김 해제" : "숨기기"}
                        onPress={handleHide}
                        disabled={loading}
                    />
                    <SettingButton
                        icon="user-x"
                        title="친구 삭제"
                        onPress={handleDeleteFriend}
                        color={theme.colors.error}
                        disabled={loading}
                    />
                </View>
            </ScrollView>
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
});

FriendProfileScreen.displayName = 'FriendProfileScreen';

export default memo(FriendProfileScreen);