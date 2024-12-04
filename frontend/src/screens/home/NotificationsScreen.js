import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
    Platform,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { notificationAPI } from '../../services/api';
import { theme } from '../../styles/theme';

const NotificationItem = memo(({ notification, onPress, onDelete }) => {
    const getIcon = (type) => {
        switch(type) {
            case 'GROUP_INVITE':
                return 'user-plus';
            case 'study':
                return 'users';
            case 'achievement':
                return 'award';
            case 'reminder':
                return 'clock';
            default:
                return 'bell';
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.notificationItem,
                !notification.read && styles.unreadItem
            ]}
            onPress={onPress}
        >
            <View style={styles.iconContainer}>
                <Icon
                    name={getIcon(notification.type)}
                    size={24}
                    color={theme.colors.primary}
                />
            </View>
            <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>
                    {notification.title}
                </Text>
                <Text style={styles.notificationMessage}>
                    {notification.message}
                </Text>
                <Text style={styles.notificationTime}>
                    {notification.time}
                </Text>
            </View>
            <TouchableOpacity 
                onPress={onDelete}
                style={styles.deleteButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Icon name="trash-2" size={20} color={theme.colors.error} />
            </TouchableOpacity>
        </TouchableOpacity>
    );
});

const EmptyNotifications = memo(() => (
    <View style={styles.emptyContainer}>
        <Icon
            name="bell-off"
            size={50}
            color={theme.colors.textTertiary}
        />
        <Text style={styles.emptyText}>
            새로운 알림이 없습니다
        </Text>
    </View>
));

const NotificationsScreen = ({ navigation }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [fcmToken, setFcmToken] = useState(null);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const response = await notificationAPI.getNotifications();
            if (response.data.success) {
                setNotifications(response.data.notifications);
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '알림을 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchNotifications();
            return () => {
                setNotifications([]);
            };
        }, [fetchNotifications])
    );

    const handleMarkAsRead = useCallback(async (notificationId) => {
        try {
            const response = await notificationAPI.markAsRead(notificationId);
            if (response.data.success) {
                setNotifications(prev =>
                    prev.map(notification =>
                        notification.id === notificationId
                            ? { ...notification, read: true }
                            : notification
                    )
                );
            }
        } catch (error) {
            Alert.alert('오류', '알림 상태를 변경하는데 실패했습니다');
        }
    }, []);

    const handleMarkAllAsRead = useCallback(async () => {
        try {
            const response = await notificationAPI.markAllAsRead();
            if (response.data.success) {
                setNotifications(prev =>
                    prev.map(notification => ({ ...notification, read: true }))
                );
                Alert.alert('알림', '모든 알림을 읽음 처리했습니다');
            }
        } catch (error) {
            Alert.alert('오류', '알림 상태를 변경하는데 실패했습니다');
        }
    }, []);

    const handleNotificationPress = useCallback((notification) => {
        if (notification.type === 'GROUP_INVITE') {
            navigation.navigate('InviteResponse', {
                inviteId: notification.data.inviteId,
                groupId: notification.data.groupId
            });
        }
        if (!notification.read) {
            handleMarkAsRead(notification.id);
        }

        switch(notification.type) {
            case 'study':
                navigation.navigate('StudyDetail', {
                    studyId: notification.referenceId
                });
                break;
            case 'achievement':
                navigation.navigate('Achievements');
                break;
            case 'reminder':
                navigation.navigate('StudySession');
                break;
            default:
                break;
        }
    }, [handleMarkAsRead, navigation]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchNotifications();
        setRefreshing(false);
    }, [fetchNotifications]);

    const registerToken = useCallback(async (token) => {
        try {
            const response = await notificationAPI.registerFCMToken(token);
            if (response.success) {
                setFcmToken(token);
            }
        } catch (error) {
            console.error('FCM 토큰 등록 실패:', error);
        }
    }, []);

    const handleDeleteNotification = useCallback(async (notificationId) => {
        try {
            const response = await notificationAPI.deleteNotification(notificationId);
            if (response.success) {
                setNotifications(prev => 
                    prev.filter(notification => notification.id !== notificationId)
                );
            }
        } catch (error) {
            Alert.alert('오류', '알림 삭제에 실패했습니다');
        }
    }, []);

    if (loading && !notifications.length) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
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
                    <Icon
                        name="arrow-left"
                        size={24}
                        color={theme.colors.text}
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>알림</Text>
                <TouchableOpacity
                    onPress={handleMarkAllAsRead}
                    disabled={!notifications.length}
                >
                    <Icon
                        name="check-square"
                        size={24}
                        color={notifications.length ? theme.colors.text : theme.colors.disabled}
                    />
                </TouchableOpacity>
            </View>

            <FlatList
                data={notifications}
                renderItem={({ item }) => (
                    <NotificationItem
                        notification={item}
                        onPress={() => handleNotificationPress(item)}
                        onDelete={() => handleDeleteNotification(item.id)}
                    />
                )}
                keyExtractor={item => item.id}
                contentContainerStyle={[
                    styles.notificationsList,
                    !notifications.length && styles.emptyList
                ]}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                ListEmptyComponent={EmptyNotifications}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    notificationsList: {
        padding: theme.spacing.md,
    },
    emptyList: {
        flex: 1,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        marginBottom: theme.spacing.sm,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    unreadItem: {
        backgroundColor: theme.colors.surfaceVariant,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surfaceVariant,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
        fontWeight: '600',
        marginBottom: 4,
    },
    notificationMessage: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    notificationTime: {
        ...theme.typography.bodySmall,
        color: theme.colors.textTertiary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textTertiary,
        marginTop: theme.spacing.sm,
    },
    deleteButton: {
        padding: 8,
        marginLeft: 'auto',
    },
});

NotificationsScreen.displayName = 'NotificationsScreen';

export default memo(NotificationsScreen);