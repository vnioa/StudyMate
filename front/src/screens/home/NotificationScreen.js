// src/screens/home/NotificationScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { theme } from '../../utils/styles';
import { date } from '../../utils/helpers';

export default function NotificationScreen() {
    const navigation = useNavigation();

    // 상태 관리
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // 알림 데이터 로드
    const loadNotifications = async (pageNum = 1, shouldRefresh = false) => {
        try {
            if (pageNum === 1) setIsLoading(true);

            const response = await api.home.getNotifications({ page: pageNum });

            const newNotifications = response.data;
            setHasMore(newNotifications.length === 20); // 페이지당 20개 기준

            if (shouldRefresh || pageNum === 1) {
                setNotifications(newNotifications);
            } else {
                setNotifications(prev => [...prev, ...newNotifications]);
            }
        } catch (error) {
            Alert.alert('오류', '알림을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // 초기 로딩
    useEffect(() => {
        loadNotifications();
    }, []);

    // 새로고침
    const handleRefresh = () => {
        setRefreshing(true);
        setPage(1);
        loadNotifications(1, true);
    };

    // 추가 로딩
    const handleLoadMore = () => {
        if (!hasMore || isLoading) return;
        const nextPage = page + 1;
        setPage(nextPage);
        loadNotifications(nextPage);
    };

    // 알림 읽음 처리
    const handleMarkAsRead = async (notificationId) => {
        try {
            await api.home.readNotification(notificationId);
            setNotifications(prev =>
                prev.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, isRead: true }
                        : notification
                )
            );
        } catch (error) {
            Alert.alert('오류', '알림 상태를 변경하는데 실패했습니다.');
        }
    };

    // 알림 삭제
    const handleDelete = async (notificationId) => {
        Alert.alert(
            '알림 삭제',
            '이 알림을 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.home.deleteNotification(notificationId);
                            setNotifications(prev =>
                                prev.filter(notification => notification.id !== notificationId)
                            );
                        } catch (error) {
                            Alert.alert('오류', '알림을 삭제하는데 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    // 알림 클릭 처리
    const handleNotificationPress = async (notification) => {
        if (!notification.isRead) {
            await handleMarkAsRead(notification.id);
        }

        // 알림 유형별 네비게이션
        switch (notification.type) {
            case 'study':
                navigation.navigate('StudyTab', {
                    screen: 'StudyDetail',
                    params: { studyId: notification.data.studyId }
                });
                break;
            case 'group':
                navigation.navigate('GroupTab', {
                    screen: 'GroupDetail',
                    params: { groupId: notification.data.groupId }
                });
                break;
            case 'chat':
                navigation.navigate('ChatTab', {
                    screen: 'ChatRoom',
                    params: { roomId: notification.data.roomId }
                });
                break;
            case 'friend':
                navigation.navigate('FriendTab', {
                    screen: 'FriendDetail',
                    params: { friendId: notification.data.friendId }
                });
                break;
            default:
                break;
        }
    };

    // 알림 아이템 렌더링
    const renderNotificationItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.notificationItem,
                !item.isRead && styles.unreadNotification
            ]}
            onPress={() => handleNotificationPress(item)}
        >
            <View style={styles.notificationIcon}>
                <Ionicons
                    name={getNotificationIcon(item.type)}
                    size={24}
                    color={theme.colors.primary.main}
                />
            </View>
            <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationMessage} numberOfLines={2}>
                    {item.message}
                </Text>
                <Text style={styles.notificationTime}>
                    {date.formatRelative(item.createdAt)}
                </Text>
            </View>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
            >
                <Ionicons name="close" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    // 알림 타입별 아이콘
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'study':
                return 'book-outline';
            case 'group':
                return 'people-outline';
            case 'chat':
                return 'chatbubble-outline';
            case 'friend':
                return 'person-outline';
            default:
                return 'notifications-outline';
        }
    };

    if (isLoading && page === 1) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={notifications}
                renderItem={renderNotificationItem}
                keyExtractor={item => item.id.toString()}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[theme.colors.primary.main]}
                    />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons
                            name="notifications-off-outline"
                            size={48}
                            color={theme.colors.text.secondary}
                        />
                        <Text style={styles.emptyText}>알림이 없습니다</Text>
                    </View>
                }
                ListFooterComponent={
                    hasMore && !refreshing && (
                        <ActivityIndicator
                            style={styles.footer}
                            size="small"
                            color={theme.colors.primary.main}
                        />
                    )
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationItem: {
        flexDirection: 'row',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.background.primary,
    },
    unreadNotification: {
        backgroundColor: theme.colors.primary.main + '10',
    },
    notificationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary.main + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    notificationContent: {
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    notificationTitle: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: theme.typography.size.body1,
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    notificationMessage: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: theme.typography.size.body2,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    notificationTime: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: theme.typography.size.caption,
        color: theme.colors.text.hint,
    },
    deleteButton: {
        padding: theme.spacing.xs,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    emptyText: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: theme.typography.size.body1,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.md,
    },
    footer: {
        padding: theme.spacing.md,
    }
});