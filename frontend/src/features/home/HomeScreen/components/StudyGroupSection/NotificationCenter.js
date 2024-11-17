// features/home/components/StudyGroupSection/NotificationCenter.js
import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useStudyGroup } from '../../../hooks/useStudyGroup';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from './styles';

const NotificationCenter = () => {
    const { notifications, markAsRead } = useStudyGroup();

    const handleNotificationPress = (notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        // 알림 타입에 따른 네비게이션 처리
    };

    const renderNotificationItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.notificationItem,
                !item.isRead && styles.unreadNotification
            ]}
            onPress={() => handleNotificationPress(item)}
        >
            <Icon
                name={item.icon}
                size={24}
                color={item.isRead ? '#666666' : '#007AFF'}
            />
            <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationMessage}>{item.message}</Text>
                <Text style={styles.notificationTime}>{item.time}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.notificationSection}>
            <View style={styles.header}>
                <Text style={styles.title}>알림 센터</Text>
                <TouchableOpacity>
                    <Text style={styles.viewAll}>전체보기</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={notifications}
                renderItem={renderNotificationItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.notificationContent}
            />
        </View>
    );
};

export default NotificationCenter;