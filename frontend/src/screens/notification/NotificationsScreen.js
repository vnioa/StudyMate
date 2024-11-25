import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    Alert,
    RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { notificationAPI } from '../../services/api';

const NotificationsScreen = ({ navigation }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationAPI.getNotifications();
            setNotifications(response.data.notifications);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '알림을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationAPI.markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, read: true }
                        : notification
                )
            );
        } catch (error) {
            Alert.alert('오류', '알림 상태를 변경하는데 실패했습니다.');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications(prev =>
                prev.map(notification => ({ ...notification, read: true }))
            );
            Alert.alert('알림', '모든 알림을 읽음 처리했습니다.');
        } catch (error) {
            Alert.alert('오류', '알림 상태를 변경하는데 실패했습니다.');
        }
    };

    const handleNotificationPress = (notification) => {
        if (!notification.read) {
            handleMarkAsRead(notification.id);
        }

        // 알림 타입에 따른 네비게이션
        switch(notification.type) {
            case 'study':
                navigation.navigate('StudyDetail', { studyId: notification.referenceId });
                break;
            case 'achievement':
                navigation.navigate('Achievements');
                break;
            case 'reminder':
                navigation.navigate('StudySession');
                break;
        }
    };

    const renderNotificationItem = ({ item }) => {
        const getIcon = (type) => {
            switch(type) {
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
                    !item.read && styles.unreadItem
                ]}
                onPress={() => handleNotificationPress(item)}
            >
                <View style={styles.iconContainer}>
                    <Icon name={getIcon(item.type)} size={24} color="#4A90E2" />
                </View>
                <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    <Text style={styles.notificationMessage}>{item.message}</Text>
                    <Text style={styles.notificationTime}>{item.time}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>알림</Text>
                <TouchableOpacity onPress={handleMarkAllAsRead}>
                    <Icon name="check-square" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {notifications.length > 0 ? (
                <FlatList
                    data={notifications}
                    renderItem={renderNotificationItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.notificationsList}
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={fetchNotifications}
                        />
                    }
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Icon name="bell-off" size={50} color="#ccc" />
                    <Text style={styles.emptyText}>새로운 알림이 없습니다</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    notificationsList: {
        padding: 15,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    unreadItem: {
        backgroundColor: '#f8f9fa',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f8ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    notificationTime: {
        fontSize: 12,
        color: '#999',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
});

export default NotificationsScreen;