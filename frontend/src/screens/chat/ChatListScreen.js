import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ActivityIndicator,
    Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import ChatListContent from './ChatListContent';
import { chatAPI } from '../../services/api';

const ChatListScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchUnreadCount();
        const unsubscribe = navigation.addListener('focus', () => {
            fetchUnreadCount();
        });

        return unsubscribe;
    }, [navigation]);

    const fetchUnreadCount = async () => {
        try {
            setLoading(true);
            const response = await chatAPI.getUnreadCount();
            setUnreadCount(response.data.count);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '알림을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleNewChat = () => {
        if (loading) return;
        navigation.navigate('NewChat');
    };

    if (loading && !unreadCount) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066FF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>채팅</Text>
                {unreadCount > 0 && (
                    <View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>{unreadCount}</Text>
                    </View>
                )}
                <Pressable
                    onPress={handleNewChat}
                    style={({ pressed }) => [
                        styles.iconButton,
                        pressed && styles.iconButtonPressed
                    ]}
                    disabled={loading}
                >
                    <Icon name="edit" size={24} color="#333" />
                </Pressable>
            </View>
            <ChatListContent
                navigation={navigation}
                onRefresh={fetchUnreadCount}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    badgeContainer: {
        position: 'absolute',
        top: 10,
        right: 45,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 6,
    },
    iconButton: {
        padding: 8,
        borderRadius: 8,
    },
    iconButtonPressed: {
        opacity: 0.7,
        backgroundColor: '#f0f0f0',
    }
});

export default ChatListScreen;